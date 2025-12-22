import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Order, restaurantInfo } from '@/data/mockData';
import { Printer, X, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ReceiptProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
}

const Receipt: React.FC<ReceiptProps> = ({ order, isOpen, onClose }) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = receiptRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=300,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Bon fiscal</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              width: 280px;
              margin: 0 auto;
              padding: 10px;
            }
            .header { text-align: center; margin-bottom: 10px; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .item { display: flex; justify-content: space-between; margin: 4px 0; }
            .item-details { font-size: 10px; color: #666; margin-left: 10px; }
            .total { font-weight: bold; font-size: 14px; }
            .footer { text-align: center; margin-top: 15px; font-size: 10px; }
          </style>
        </head>
        <body>${printContent.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('ro-RO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const subtotal = order.totalAmount;
  const tip = order.tip || 0;
  const total = subtotal + tip;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Bon Fiscal</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-1" />
                Print
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div 
          ref={receiptRef}
          className="bg-background p-4 font-mono text-xs border rounded-lg"
        >
          {/* Header */}
          <div className="text-center mb-3">
            <h2 className="font-bold text-sm">{restaurantInfo.name}</h2>
            <p>{restaurantInfo.address}</p>
            <p>Tel: {restaurantInfo.phone}</p>
            <p>CUI: {restaurantInfo.cui}</p>
            <p>Reg.Com: {restaurantInfo.regCom}</p>
          </div>

          <div className="border-t border-dashed border-border my-2" />

          {/* Order Info */}
          <div className="mb-2">
            <p>Nr. comandă: {order.id}</p>
            {order.tableNumber && <p>Masa: {order.tableNumber}</p>}
            <p>Ospătar: {order.waiterName}</p>
            <p>Data: {formatDate(order.paidAt || order.createdAt)}</p>
          </div>

          <div className="border-t border-dashed border-border my-2" />

          {/* Items */}
          <div className="space-y-2">
            {order.items.map(item => (
              <div key={item.id}>
                <div className="flex justify-between">
                  <span>{item.quantity}x {item.menuItem.name}</span>
                  <span>{(item.menuItem.price * item.quantity).toFixed(2)}</span>
                </div>
                {(item.modifications.added.length > 0 || item.modifications.removed.length > 0) && (
                  <div className="text-[10px] text-muted-foreground ml-3">
                    {item.modifications.added.map(a => `+${a}`).join(', ')}
                    {item.modifications.removed.map(r => `-${r}`).join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-border my-2" />

          {/* Totals */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{subtotal.toFixed(2)} RON</span>
            </div>
            {tip > 0 && (
              <div className="flex justify-between">
                <span>Bacșiș:</span>
                <span>{tip.toFixed(2)} RON</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm">
              <span>TOTAL:</span>
              <span>{total.toFixed(2)} RON</span>
            </div>
          </div>

          {/* CUI Client */}
          {order.cui && (
            <>
              <div className="border-t border-dashed border-border my-2" />
              <div>
                <p className="font-bold">Factură pentru:</p>
                <p>CUI: {order.cui}</p>
              </div>
            </>
          )}

          <div className="border-t border-dashed border-border my-2" />

          {/* Footer */}
          <div className="text-center text-[10px] text-muted-foreground">
            <p>Vă mulțumim pentru vizită!</p>
            <p>Acest bon ține loc de factură fiscală</p>
            <p className="mt-2">* * * * *</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Receipt;
