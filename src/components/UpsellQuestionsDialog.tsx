import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UpsellQuestion, ExpiringProduct, MenuItem, upsellQuestions, expiringProducts, menuItems } from '@/data/mockData';
import { Check, X, Clock, AlertTriangle, ShoppingCart, ChevronRight, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UpsellQuestionsDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (selectedProducts: MenuItem[]) => void;
  currentOrderItems: string[]; // IDs of products already in order
}

const UpsellQuestionsDialog: React.FC<UpsellQuestionsDialogProps> = ({
  open,
  onClose,
  onConfirm,
  currentOrderItems,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedProducts, setSelectedProducts] = useState<MenuItem[]>([]);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});

  const enabledQuestions = upsellQuestions.filter(q => q.enabled).sort((a, b) => a.order - b.order);
  const currentQuestion = enabledQuestions[currentQuestionIndex];

  const getProductsForQuestion = (question: UpsellQuestion): MenuItem[] => {
    if (question.type === 'products') {
      // Return expiring products
      return expiringProducts
        .map(ep => menuItems.find(m => m.id === ep.productId))
        .filter((m): m is MenuItem => m !== undefined && !currentOrderItems.includes(m.id));
    }
    
    if (question.category) {
      return menuItems
        .filter(m => m.category === question.category && !currentOrderItems.includes(m.id))
        .slice(0, 6);
    }
    
    return [];
  };

  const getExpiringInfo = (productId: string): ExpiringProduct | undefined => {
    return expiringProducts.find(ep => ep.productId === productId);
  };

  const formatTimeRemaining = (expiresAt: Date): string => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleProductToggle = (product: MenuItem) => {
    if (selectedProducts.find(p => p.id === product.id)) {
      setSelectedProducts(selectedProducts.filter(p => p.id !== product.id));
    } else {
      setSelectedProducts([...selectedProducts, product]);
    }
  };

  const handleAnswer = (accepted: boolean) => {
    setAnswers({ ...answers, [currentQuestion.id]: accepted });
    
    if (currentQuestionIndex < enabledQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Last question - confirm with selected products
      onConfirm(selectedProducts);
      resetState();
    }
  };

  const handleSkipAll = () => {
    onConfirm([]);
    resetState();
  };

  const handleConfirmWithProducts = () => {
    onConfirm(selectedProducts);
    resetState();
  };

  const resetState = () => {
    setCurrentQuestionIndex(0);
    setSelectedProducts([]);
    setAnswers({});
  };

  const handleClose = () => {
    onClose();
    resetState();
  };

  if (enabledQuestions.length === 0) {
    onConfirm([]);
    return null;
  }

  const products = currentQuestion ? getProductsForQuestion(currentQuestion) : [];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              Sugestii pentru client
            </DialogTitle>
            <Badge variant="secondary">
              {currentQuestionIndex + 1} / {enabledQuestions.length}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Question */}
          <div className="py-4">
            <h3 className="text-lg font-semibold text-center">
              {currentQuestion?.question}
            </h3>
          </div>

          {/* Products Grid */}
          {products.length > 0 && (
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="grid grid-cols-2 gap-3 pb-4">
                {products.map(product => {
                  const isSelected = selectedProducts.find(p => p.id === product.id);
                  const expiringInfo = getExpiringInfo(product.id);
                  
                  return (
                    <Card
                      key={product.id}
                      className={cn(
                        "p-3 cursor-pointer transition-all hover:shadow-md",
                        isSelected && "ring-2 ring-primary bg-primary/5"
                      )}
                      onClick={() => handleProductToggle(product)}
                    >
                      {product.image && (
                        <div className="aspect-video rounded-lg overflow-hidden mb-2 bg-secondary">
                          <img 
                            src={product.image} 
                            alt={product.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-2">{product.name}</h4>
                          {expiringInfo && (
                            <div className="flex items-center gap-1 mt-1 text-warning">
                              <AlertTriangle className="w-3 h-3" />
                              <span className="text-xs">
                                Expiră în {formatTimeRemaining(expiringInfo.expiresAt)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-primary text-sm">{product.price} RON</span>
                          {expiringInfo && (
                            <Badge className="bg-warning/20 text-warning text-xs mt-1">
                              <Percent className="w-3 h-3 mr-1" />
                              -20%
                            </Badge>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          {/* Selected Products Summary */}
          {selectedProducts.length > 0 && (
            <div className="py-2 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {selectedProducts.length} produse selectate
                </span>
                <span className="font-bold text-primary">
                  +{selectedProducts.reduce((sum, p) => sum + p.price, 0).toFixed(2)} RON
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="ghost"
            onClick={handleSkipAll}
            className="text-muted-foreground"
          >
            Sari toate întrebările
          </Button>
          
          <div className="flex gap-2 flex-1 justify-end">
            {currentQuestion?.type === 'simple' && products.length === 0 ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleAnswer(false)}
                  className="flex-1 sm:flex-none"
                >
                  <X className="w-4 h-4 mr-2" />
                  Nu
                </Button>
                <Button
                  onClick={() => handleAnswer(true)}
                  className="flex-1 sm:flex-none"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Da, arată produse
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleAnswer(false)}
                >
                  <ChevronRight className="w-4 h-4 mr-2" />
                  {currentQuestionIndex < enabledQuestions.length - 1 ? 'Următoarea' : 'Continuă'}
                </Button>
                {selectedProducts.length > 0 && (
                  <Button onClick={handleConfirmWithProducts}>
                    <Check className="w-4 h-4 mr-2" />
                    Adaugă ({selectedProducts.length})
                  </Button>
                )}
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpsellQuestionsDialog;
