/**
 * ALGORITM SCHEDULING KDS - REGULA EXACTA
 *
 * Obiective:
 * - Core per comanda: "finish together" pe aceeasi prioritate (P1/P2/...).
 * - Global multi-masa: alocare pe KDS cu operatori multipli, SLA, fairness si stabilitate la replanificare.
 *
 * Formula principala (core, per comanda):
 * - maxPrep(Px) = durata maxima de preparare din prioritatea x
 * - priorityFinishAt(Px) = priorityStartAt(Px) + maxPrep(Px)
 * - itemStartAt(i) = priorityFinishAt(Px) - prepMinutes(i)
 *
 * Reguli de executie (core):
 * 1) Grupare:
 *    - Se iau doar item-urile cu status pending.
 *    - Se grupeaza pe priorityLevel (P1, P2, P3...).
 * 2) Ordine prioritati:
 *    - Prioritatile se proceseaza crescator (P1 -> P2 -> P3).
 * 3) Sincronizare in prioritate:
 *    - Tinta comuna este priorityFinishAt; fiecare item primeste start individual calculat
 *      prin scaderea propriului prepMinutes din aceeasi tinta.
 * 4) Delay intre prioritati:
 *    - Dupa finalizarea unei prioritati se aplica delayAfterMinutes:
 *      nextPriorityStart = currentPriorityFinish + delayAfterMinutes(currentPriority).
 * 5) Constrangere KDS (fara overlap pe acelasi slot):
 *    - Pe acelasi KDS task-urile sunt secventiale; urmatorul item porneste doar dupa
 *      availableAt al KDS-ului.
 * 6) Early fill / utilizare timp mort:
 *    - Daca KDS-ul este liber inainte de startul sincronizat al item-ului, item-ul poate
 *      fi pornit mai devreme (advancedBeforeSyncedStart = true) pentru a folosi idle time.
 * 7) Busy blocks:
 *    - Ferestrele ocupate (kdsBusyBlocks) muta availableAt in viitor, astfel incat scheduler-ul
 *      sa nu planifice peste intervale indisponibile.
 *
 * Reguli globale (multi-masa, execution):
 * - Coada globala per KDS (nu per masa), prioritizare prin scor (priority + SLA risk + waiting + fairness).
 * - Capacitate dinamica pe KDS:
 *   activeOperatorsByKds (runtime) > operatorCount > parallelSlots > defaultKdsSlots.
 * - Skill matching pe operator:
 *   item.requiredSkillTags este alocat preferabil pe slot compatibil (fallback pe primul slot disponibil).
 * - Batching:
 *   item.batchKey + item.maxBatchSize reduc effectivePrepMinutes cand exista produse similare in coada.
 * - Freeze window:
 *   task-urile foarte apropiate de start sunt marcate frozen pentru stabilitate operationala.
 * - Replan reason:
 *   output-ul include cauza replanificarii (initial/new_order/capacity_changed/urgent_sla/manual).
 *
 * API de apel:
 * - buildOrderPrioritySchedule(...) pentru plan pe o singura comanda.
 * - buildGlobalKdsSchedule(...) pentru plan global pe mai multe comenzi/mese.
 * - formatPlanTime(...) pentru afisare HH:mm in UI.
 *
 * Nota:
 * - Regulile complete sunt centralizate in constanta GLOBAL_SCHEDULING_RULES.
 */

export type SchedulerItemStatus = 'pending' | 'cooking' | 'ready' | 'served';

export interface SchedulerItemInput {
  itemId: string;
  orderId: string;
  tableLabel: string;
  name: string;
  kdsId: string;
  priorityLevel: number;
  prepMinutes: number;
  batchKey?: string; // ex: "shaorma-pui"
  maxBatchSize?: number; // cate item-uri similare pot fi executate eficient impreuna
  requiredSkillTags?: string[]; // ex: ["grill", "doner"]
  status?: SchedulerItemStatus;
}

export interface SchedulerPriorityConfig {
  priorityLevel: number;
  delayAfterMinutes: number;
}

export interface KdsBusyBlock {
  kdsId: string;
  busyFrom: Date;
  busyUntil: Date;
  reason?: string;
}

export interface PlannedItem {
  itemId: string;
  orderId: string;
  tableLabel: string;
  name: string;
  kdsId: string;
  priorityLevel: number;
  prepMinutes: number;
  plannedStartAt: Date;
  plannedFinishAt: Date;
  syncedFinishAt: Date;
  advancedBeforeSyncedStart: boolean;
}

export interface PriorityWindowPlan {
  priorityLevel: number;
  priorityStartAt: Date;
  priorityFinishAt: Date;
  maxPrepMinutes: number;
  items: PlannedItem[];
}

export interface SchedulePlan {
  generatedAt: Date;
  orderId: string;
  windows: PriorityWindowPlan[];
  allItems: PlannedItem[];
}

interface KdsCursor {
  kdsId: string;
  availableAt: Date;
}

function toDate(value: Date): Date {
  return new Date(value.getTime());
}

function addMinutes(base: Date, minutes: number): Date {
  return new Date(base.getTime() + Math.max(0, minutes) * 60_000);
}

function subtractMinutes(base: Date, minutes: number): Date {
  return new Date(base.getTime() - Math.max(0, minutes) * 60_000);
}

function maxPrep(items: SchedulerItemInput[]): number {
  return items.reduce((max, item) => Math.max(max, Math.max(1, item.prepMinutes || 0)), 1);
}

function groupByPriority(items: SchedulerItemInput[]): Map<number, SchedulerItemInput[]> {
  const map = new Map<number, SchedulerItemInput[]>();
  for (const item of items) {
    const level = Math.max(1, item.priorityLevel || 1);
    const list = map.get(level) ?? [];
    list.push({ ...item, prepMinutes: Math.max(1, item.prepMinutes || 0), priorityLevel: level });
    map.set(level, list);
  }
  return map;
}

function sortPrioritiesAsc(levels: number[]): number[] {
  return [...new Set(levels)].sort((a, b) => a - b);
}

function createKdsCursors(now: Date, busy: KdsBusyBlock[]): Map<string, KdsCursor> {
  const cursors = new Map<string, KdsCursor>();
  for (const block of busy) {
    const current = cursors.get(block.kdsId);
    const until = block.busyUntil > now ? block.busyUntil : now;
    if (!current) {
      cursors.set(block.kdsId, { kdsId: block.kdsId, availableAt: toDate(until) });
      continue;
    }
    if (until > current.availableAt) {
      current.availableAt = toDate(until);
    }
  }
  return cursors;
}

function getDelay(level: number, configMap: Map<number, SchedulerPriorityConfig>): number {
  return Math.max(0, configMap.get(level)?.delayAfterMinutes ?? 0);
}

/**
 * Planifica o singura comanda pe baza prioritatilor ei.
 * Nu scrie in DB si nu modifica stari.
 */
export function buildOrderPrioritySchedule(params: {
  orderId: string;
  now: Date;
  items: SchedulerItemInput[];
  priorities: SchedulerPriorityConfig[];
  kdsBusyBlocks?: KdsBusyBlock[];
}): SchedulePlan {
  const now = toDate(params.now);
  const busy = params.kdsBusyBlocks ?? [];
  const byPriority = groupByPriority(params.items.filter((x) => (x.status ?? 'pending') === 'pending'));
  const priorityLevels = sortPrioritiesAsc([...byPriority.keys()]);
  const configMap = new Map(params.priorities.map((p) => [p.priorityLevel, p]));
  const kdsCursors = createKdsCursors(now, busy);

  const windows: PriorityWindowPlan[] = [];
  let cursor = toDate(now);

  for (const level of priorityLevels) {
    const items = byPriority.get(level) ?? [];
    if (items.length === 0) continue;

    const priorityStartAt = toDate(cursor);
    const maxPrepMinutes = maxPrep(items);
    const priorityFinishAt = addMinutes(priorityStartAt, maxPrepMinutes);

    const plannedItems: PlannedItem[] = items.map((item) => {
      const syncedStart = subtractMinutes(priorityFinishAt, item.prepMinutes);
      const kdsState = kdsCursors.get(item.kdsId) ?? { kdsId: item.kdsId, availableAt: toDate(now) };
      const availableAt = kdsState.availableAt;

      // Daca KDS-ul e liber mai devreme decat startul sincronizat, lansam mai devreme.
      // Daca e ocupat, nu permitem start dupa sincron (in practica aici ar trebui marcat conflict).
      const canAdvance = availableAt < syncedStart;
      const plannedStartAt = canAdvance ? toDate(availableAt) : toDate(syncedStart);
      const plannedFinishAt = addMinutes(plannedStartAt, item.prepMinutes);

      kdsState.availableAt = toDate(plannedFinishAt);
      kdsCursors.set(item.kdsId, kdsState);

      return {
        itemId: item.itemId,
        orderId: item.orderId,
        tableLabel: item.tableLabel,
        name: item.name,
        kdsId: item.kdsId,
        priorityLevel: item.priorityLevel,
        prepMinutes: item.prepMinutes,
        plannedStartAt,
        plannedFinishAt,
        syncedFinishAt: toDate(priorityFinishAt),
        advancedBeforeSyncedStart: canAdvance,
      };
    });

    windows.push({
      priorityLevel: level,
      priorityStartAt,
      priorityFinishAt,
      maxPrepMinutes,
      items: plannedItems.sort((a, b) => a.plannedStartAt.getTime() - b.plannedStartAt.getTime()),
    });

    // Urmatoarea prioritate incepe dupa finalizarea celei curente + delay configurat.
    cursor = addMinutes(priorityFinishAt, getDelay(level, configMap));
  }

  const allItems = windows.flatMap((w) => w.items);
  return {
    generatedAt: now,
    orderId: params.orderId,
    windows,
    allItems,
  };
}

/**
 * Helper pentru afisare debug in UI/logs.
 */
export function formatPlanTime(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * REGULI COMPLETE pentru scheduling global (mai multe mese/comenzi).
 * Aceste reguli definesc comportamentul dorit al motorului.
 */
export const GLOBAL_SCHEDULING_RULES = {
  R1_GLOBAL_QUEUE_PER_KDS:
    'Toate item-urile pending din toate mesele intra in aceeasi coada per kdsId.',
  R2_HARD_PRIORITY_ORDER:
    'Prioritatea mai mica (P1) se planifica inainte de prioritatea mai mare (P2, P3), cu exceptia urgentei SLA.',
  R3_SAME_PRIORITY_FINISH_TOGETHER:
    'In aceeasi comanda si aceeasi prioritate, item-urile trebuie sa aiba acelasi syncedFinishAt.',
  R4_INTER_PRIORITY_DELAY:
    'Dupa fiecare prioritate se aplica delayAfterMinutes pentru prioritatea urmatoare din aceeasi comanda.',
  R5_KDS_CAPACITY_LIMIT:
    'Fiecare KDS are capacitate (sloturi paralele). Nu se depaseste numarul de sloturi active.',
  R6_KDS_CHANGEOVER_COST:
    'Intre item-uri de tip diferit pe acelasi KDS se aplica setup/changeover minutes.',
  R7_SLA_FIRST_ESCALATION:
    'Daca ETA estimat depaseste promisedAt, comanda primeste boost de urgenta la scor.',
  R8_PRIORITY_AGING:
    'Cu cat un item asteapta mai mult, cu atat ii creste scorul pentru a evita starvation.',
  R9_FREEZE_WINDOW:
    'Task-urile care incep in freezeWindowMinutes nu se replaseaza (stabilitate operationala).',
  R10_NO_PREEMPT_FOR_COOKING:
    'Item-urile aflate deja in cooking nu sunt intrerupte; doar pending poate fi replanificat.',
  R11_EARLY_FILL_ON_IDLE:
    'Daca un KDS are timp liber inainte de startul sincronizat, poate executa item-uri scurte in avans.',
  R12_FAIRNESS_BY_TABLE:
    'Nicio masa nu trebuie blocata indefinit; se aplica penalizare pozitiva pentru mese cu wait mare.',
} as const;

export type SchedulingPolicyMode = 'strict-priority' | 'sla-first' | 'hybrid-priority-sla';

export interface GlobalOrderInput {
  orderId: string;
  tableLabel: string;
  createdAt: Date;
  promisedAt?: Date;
  channel?: 'dine-in' | 'delivery' | 'takeaway';
  items: SchedulerItemInput[];
  priorities: SchedulerPriorityConfig[];
}

export interface KdsStationConfig {
  kdsId: string;
  parallelSlots: number; // ex: 1, 2, 3
  operatorCount?: number; // daca este setat, suprascrie parallelSlots
  operatorSkills?: string[][]; // skill tags per operator/slot index
  changeoverMinutes?: number; // cost setup intre produse diferite
}

export interface SchedulingPolicy {
  mode: SchedulingPolicyMode;
  freezeWindowMinutes: number;
  defaultKdsSlots: number;
  defaultChangeoverMinutes: number;
  weights: {
    priority: number;
    slaRisk: number;
    waiting: number;
    fairness: number;
  };
}

export interface GlobalSchedulerParams {
  now: Date;
  orders: GlobalOrderInput[];
  kdsStations?: KdsStationConfig[];
  activeOperatorsByKds?: Record<string, number>; // override runtime (ex: tura actuala)
  kdsBusyBlocks?: KdsBusyBlock[];
  replanReason?: 'initial' | 'new_order' | 'capacity_changed' | 'urgent_sla' | 'manual';
  policy?: Partial<SchedulingPolicy>;
}

export interface GlobalPlannedItem extends PlannedItem {
  score: number;
  tableWaitMinutes: number;
  slaRiskMinutes: number;
  frozen: boolean;
  slotIndex: number;
  assignedOperatorIndex: number;
  operatorSkillMatch: boolean;
  batchSizeApplied: number;
  effectivePrepMinutes: number;
  replanReason?: GlobalSchedulerParams['replanReason'];
}

export interface KdsTimelineBlock {
  kdsId: string;
  slotIndex: number;
  startAt: Date;
  finishAt: Date;
  itemId: string;
  orderId: string;
  tableLabel: string;
}

export interface GlobalSchedulePlan {
  generatedAt: Date;
  replanReason?: GlobalSchedulerParams['replanReason'];
  appliedOperatorCountByKds: Record<string, number>;
  items: GlobalPlannedItem[];
  kdsTimeline: KdsTimelineBlock[];
  byOrder: Record<string, GlobalPlannedItem[]>;
}

const DEFAULT_POLICY: SchedulingPolicy = {
  mode: 'hybrid-priority-sla',
  freezeWindowMinutes: 3,
  defaultKdsSlots: 1,
  defaultChangeoverMinutes: 0,
  weights: {
    priority: 100,
    slaRisk: 10,
    waiting: 2,
    fairness: 1,
  },
};

interface SlotCursor {
  slotIndex: number;
  availableAt: Date;
  skillTags?: string[];
  lastOrderId?: string;
}

function minutesDiff(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / 60_000);
}

function resolvePolicy(policy?: Partial<SchedulingPolicy>): SchedulingPolicy {
  if (!policy) return DEFAULT_POLICY;
  return {
    ...DEFAULT_POLICY,
    ...policy,
    weights: {
      ...DEFAULT_POLICY.weights,
      ...(policy.weights ?? {}),
    },
  };
}

function mapKdsStations(stations: KdsStationConfig[] | undefined, policy: SchedulingPolicy) {
  const map = new Map<string, KdsStationConfig>();
  for (const st of stations ?? []) {
    map.set(st.kdsId, {
      kdsId: st.kdsId,
      parallelSlots: Math.max(1, st.parallelSlots || policy.defaultKdsSlots),
      changeoverMinutes: Math.max(0, st.changeoverMinutes ?? policy.defaultChangeoverMinutes),
    });
  }
  return map;
}

function ensureSlots(
  kdsId: string,
  now: Date,
  slotsByKds: Map<string, SlotCursor[]>,
  stationMap: Map<string, KdsStationConfig>,
  policy: SchedulingPolicy,
  activeOperatorsByKds?: Record<string, number>
): SlotCursor[] {
  const existing = slotsByKds.get(kdsId);
  if (existing) return existing;
  const station = stationMap.get(kdsId);
  const runtimeCount = activeOperatorsByKds?.[kdsId];
  const count = Math.max(
    1,
    runtimeCount ?? station?.operatorCount ?? station?.parallelSlots ?? policy.defaultKdsSlots
  );
  const slots: SlotCursor[] = Array.from({ length: count }).map((_, idx) => ({
    slotIndex: idx,
    availableAt: toDate(now),
    skillTags: station?.operatorSkills?.[idx] ?? [],
  }));
  slotsByKds.set(kdsId, slots);
  return slots;
}

function applyBusyBlocks(
  slotsByKds: Map<string, SlotCursor[]>,
  blocks: KdsBusyBlock[],
  now: Date,
  stationMap: Map<string, KdsStationConfig>,
  policy: SchedulingPolicy,
  activeOperatorsByKds?: Record<string, number>
) {
  for (const block of blocks) {
    const slots = ensureSlots(
      block.kdsId,
      now,
      slotsByKds,
      stationMap,
      policy,
      activeOperatorsByKds
    );
    if (slots.length === 0) continue;
    // Heuristic: blocheaza primul slot disponibil cel mai devreme.
    slots.sort((a, b) => a.availableAt.getTime() - b.availableAt.getTime());
    const chosen = slots[0];
    if (block.busyUntil > chosen.availableAt) {
      chosen.availableAt = toDate(block.busyUntil);
    }
  }
}

function flattenPendingItems(orders: GlobalOrderInput[]): SchedulerItemInput[] {
  return orders.flatMap((order) =>
    order.items
      .filter((item) => (item.status ?? 'pending') === 'pending')
      .map((item) => ({
        ...item,
        orderId: order.orderId,
        tableLabel: order.tableLabel,
      }))
  );
}

function avgTableWait(orders: GlobalOrderInput[], now: Date): Map<string, number> {
  const map = new Map<string, number>();
  const byTable = new Map<string, number[]>();
  for (const o of orders) {
    const wait = Math.max(0, minutesDiff(now, o.createdAt));
    const arr = byTable.get(o.tableLabel) ?? [];
    arr.push(wait);
    byTable.set(o.tableLabel, arr);
  }
  for (const [table, waits] of byTable) {
    const total = waits.reduce((s, x) => s + x, 0);
    map.set(table, waits.length > 0 ? total / waits.length : 0);
  }
  return map;
}

function priorityFinishTarget(
  order: GlobalOrderInput,
  level: number,
  now: Date
): Date {
  const pendingInLevel = order.items.filter(
    (it) => (it.status ?? 'pending') === 'pending' && Math.max(1, it.priorityLevel || 1) === level
  );
  const levelMax = maxPrep(pendingInLevel.length > 0 ? pendingInLevel : [{ prepMinutes: 1 } as SchedulerItemInput]);

  const levels = sortPrioritiesAsc(
    order.items
      .filter((it) => (it.status ?? 'pending') === 'pending')
      .map((it) => Math.max(1, it.priorityLevel || 1))
  );
  const cfg = new Map(order.priorities.map((p) => [p.priorityLevel, p]));

  let cursor = toDate(now);
  for (const lv of levels) {
    const lvItems = order.items.filter(
      (it) => (it.status ?? 'pending') === 'pending' && Math.max(1, it.priorityLevel || 1) === lv
    );
    if (lvItems.length === 0) continue;
    const fin = addMinutes(cursor, maxPrep(lvItems as SchedulerItemInput[]));
    if (lv === level) return fin;
    cursor = addMinutes(fin, Math.max(0, cfg.get(lv)?.delayAfterMinutes ?? 0));
  }
  return addMinutes(now, levelMax);
}

function itemScore(
  item: SchedulerItemInput,
  order: GlobalOrderInput,
  now: Date,
  tableWaitMinutes: number,
  policy: SchedulingPolicy
): { score: number; slaRiskMinutes: number } {
  const priority = Math.max(1, item.priorityLevel || 1);
  const basePriorityScore = (10 - Math.min(priority, 10)) * policy.weights.priority;

  const waitingMinutes = Math.max(0, minutesDiff(now, order.createdAt));
  const waitingScore = waitingMinutes * policy.weights.waiting;

  let slaRiskMinutes = 0;
  if (order.promisedAt) {
    const eta = priorityFinishTarget(order, priority, now);
    slaRiskMinutes = Math.max(0, minutesDiff(eta, order.promisedAt));
  }
  const slaScore = slaRiskMinutes * policy.weights.slaRisk;
  const fairnessScore = tableWaitMinutes * policy.weights.fairness;

  if (policy.mode === 'strict-priority') {
    return { score: basePriorityScore + waitingScore * 0.5 + fairnessScore * 0.5, slaRiskMinutes };
  }
  if (policy.mode === 'sla-first') {
    return { score: slaScore * 2 + basePriorityScore * 0.4 + fairnessScore, slaRiskMinutes };
  }
  // hybrid-priority-sla
  return { score: basePriorityScore + slaScore + waitingScore + fairnessScore, slaRiskMinutes };
}

function isFrozen(startAt: Date, now: Date, freezeWindowMinutes: number): boolean {
  return minutesDiff(startAt, now) <= freezeWindowMinutes;
}

function canSlotHandleSkills(slot: SlotCursor, requiredSkills?: string[]): boolean {
  if (!requiredSkills || requiredSkills.length === 0) return true;
  const tags = new Set(slot.skillTags ?? []);
  return requiredSkills.every((skill) => tags.has(skill));
}

function chooseSlotForItem(slots: SlotCursor[], item: SchedulerItemInput): {
  slot: SlotCursor;
  operatorSkillMatch: boolean;
} {
  const skillMatched = slots
    .filter((s) => canSlotHandleSkills(s, item.requiredSkillTags))
    .sort((a, b) => a.availableAt.getTime() - b.availableAt.getTime());
  if (skillMatched.length > 0) {
    return { slot: skillMatched[0], operatorSkillMatch: true };
  }
  const fallback = [...slots].sort((a, b) => a.availableAt.getTime() - b.availableAt.getTime())[0];
  return { slot: fallback, operatorSkillMatch: false };
}

function computeBatchSize(remaining: SchedulerItemInput[], current: SchedulerItemInput): number {
  const maxBatch = Math.max(1, current.maxBatchSize ?? 1);
  const key = current.batchKey?.trim();
  if (!key || maxBatch <= 1) return 1;
  const siblings = remaining.filter((x) => x.kdsId === current.kdsId && x.batchKey === key).length;
  return Math.max(1, Math.min(maxBatch, siblings + 1));
}

/**
 * Scheduler global pentru mai multe mese/comenzi.
 * NU scrie in DB; doar construieste un plan.
 */
export function buildGlobalKdsSchedule(params: GlobalSchedulerParams): GlobalSchedulePlan {
  const now = toDate(params.now);
  const policy = resolvePolicy(params.policy);
  const stationMap = mapKdsStations(params.kdsStations, policy);
  const tableWaitMap = avgTableWait(params.orders, now);

  const orderMap = new Map(params.orders.map((o) => [o.orderId, o]));
  const candidates = flattenPendingItems(params.orders);

  const slotsByKds = new Map<string, SlotCursor[]>();
  applyBusyBlocks(
    slotsByKds,
    params.kdsBusyBlocks ?? [],
    now,
    stationMap,
    policy,
    params.activeOperatorsByKds
  );

  const remaining = [...candidates];
  const planned: GlobalPlannedItem[] = [];
  const timeline: KdsTimelineBlock[] = [];

  while (remaining.length > 0) {
    let bestIndex = 0;
    let bestScore = Number.NEGATIVE_INFINITY;
    let bestMeta: { slaRiskMinutes: number; tableWait: number } = { slaRiskMinutes: 0, tableWait: 0 };

    for (let i = 0; i < remaining.length; i++) {
      const item = remaining[i];
      const order = orderMap.get(item.orderId);
      if (!order) continue;
      const tableWait = tableWaitMap.get(order.tableLabel) ?? 0;
      const { score, slaRiskMinutes } = itemScore(item, order, now, tableWait, policy);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
        bestMeta = { slaRiskMinutes, tableWait };
      }
    }

    const [item] = remaining.splice(bestIndex, 1);
    const slots = ensureSlots(
      item.kdsId,
      now,
      slotsByKds,
      stationMap,
      policy,
      params.activeOperatorsByKds
    );
    const { slot: chosenSlot, operatorSkillMatch } = chooseSlotForItem(slots, item);

    const changeover =
      stationMap.get(item.kdsId)?.changeoverMinutes ?? policy.defaultChangeoverMinutes;
    const batchSizeApplied = computeBatchSize(remaining, item);
    const effectivePrepMinutes = Math.max(1, Math.ceil(item.prepMinutes / batchSizeApplied));
    const startAt = addMinutes(chosenSlot.availableAt, changeover);
    const finishAt = addMinutes(startAt, effectivePrepMinutes);

    chosenSlot.availableAt = toDate(finishAt);
    chosenSlot.lastOrderId = item.orderId;

    const order = orderMap.get(item.orderId)!;
    const syncedFinish = priorityFinishTarget(order, Math.max(1, item.priorityLevel || 1), now);

    const plannedItem: GlobalPlannedItem = {
      itemId: item.itemId,
      orderId: item.orderId,
      tableLabel: item.tableLabel,
      name: item.name,
      kdsId: item.kdsId,
      priorityLevel: Math.max(1, item.priorityLevel || 1),
      prepMinutes: Math.max(1, item.prepMinutes || 0),
      plannedStartAt: startAt,
      plannedFinishAt: finishAt,
      syncedFinishAt: syncedFinish,
      advancedBeforeSyncedStart: startAt < subtractMinutes(syncedFinish, Math.max(1, item.prepMinutes || 0)),
      score: bestScore,
      tableWaitMinutes: bestMeta.tableWait,
      slaRiskMinutes: bestMeta.slaRiskMinutes,
      frozen: isFrozen(startAt, now, policy.freezeWindowMinutes),
      slotIndex: chosenSlot.slotIndex,
      assignedOperatorIndex: chosenSlot.slotIndex,
      operatorSkillMatch,
      batchSizeApplied,
      effectivePrepMinutes,
      replanReason: params.replanReason,
    };

    planned.push(plannedItem);
    timeline.push({
      kdsId: item.kdsId,
      slotIndex: chosenSlot.slotIndex,
      startAt,
      finishAt,
      itemId: item.itemId,
      orderId: item.orderId,
      tableLabel: item.tableLabel,
    });
  }

  const byOrder: Record<string, GlobalPlannedItem[]> = {};
  for (const item of planned) {
    byOrder[item.orderId] = byOrder[item.orderId] ?? [];
    byOrder[item.orderId].push(item);
  }
  for (const key of Object.keys(byOrder)) {
    byOrder[key].sort((a, b) => a.plannedStartAt.getTime() - b.plannedStartAt.getTime());
  }

  timeline.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

  const appliedOperatorCountByKds: Record<string, number> = {};
  for (const [kdsId, slots] of slotsByKds.entries()) {
    appliedOperatorCountByKds[kdsId] = slots.length;
  }

  return {
    generatedAt: now,
    replanReason: params.replanReason,
    appliedOperatorCountByKds,
    items: planned,
    kdsTimeline: timeline,
    byOrder,
  };
}

