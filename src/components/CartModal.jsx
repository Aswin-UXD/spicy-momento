import React from 'react';

const CartModal = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
  isCheckingOut,
  orderConfirmed
}) => {
  if (!isOpen) return null;

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className='cart-overlay' onClick={onClose} role='dialog' aria-modal='true'>
      <div className='cart-drawer' onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className='cart-header'>
          <div className='cart-header-title'>
            <span className='cart-icon'>🛒</span>
            <h3>Your Spicy Cart</h3>
            <span className='cart-count-pill'>
              {cartItems.reduce((acc, i) => acc + i.quantity, 0)} items
            </span>
          </div>
          <button className='btn-close-cart' onClick={onClose} aria-label='Close Cart'>
            ✕
          </button>
        </div>

        {/* Content */}
        <div className='cart-body'>
          {orderConfirmed ? (
            <div className='cart-success-state'>
              <div className='success-icon'>🎉🌶</div>
              <h4>Order Confirmed & Placed!</h4>
              <p>Your fiery street feast has been saved in MongoDB and sent to the kitchen!</p>
              <div className='order-ticket'>
                <div className='order-ticket-row header-row'>
                  <strong>Order #: {orderConfirmed.orderNumber}</strong>
                  {orderConfirmed.totalAmount && (
                    <strong className='ticket-amount'>${orderConfirmed.totalAmount.toFixed(2)}</strong>
                  )}
                </div>

                <div className='order-ticket-detail'>
                  <span>Payment Method:</span>
                  <span className='payment-badge-pill-inline'>
                    {orderConfirmed.paymentMethod === 'card' && '💳 Card'}
                    {orderConfirmed.paymentMethod === 'upi' && '📱 UPI'}
                    {orderConfirmed.paymentMethod === 'cod' && '💵 Cash on Delivery'}
                    {!orderConfirmed.paymentMethod && '💳 Card'}
                  </span>
                </div>

                <div className='order-ticket-detail'>
                  <span>Payment Status:</span>
                  <span className={`payment-status-badge ${orderConfirmed.paymentStatus || 'paid'}`}>
                    {(orderConfirmed.paymentStatus || 'paid').toUpperCase()}
                  </span>
                </div>

                {orderConfirmed.transactionId && (
                  <div className='order-ticket-detail'>
                    <span>Txn ID:</span>
                    <code className='txn-code'>{orderConfirmed.transactionId}</code>
                  </div>
                )}

                {orderConfirmed.deliveryAddress && (
                  <div className='order-ticket-detail'>
                    <span>Delivery To:</span>
                    <span>{orderConfirmed.deliveryAddress}</span>
                  </div>
                )}

                <div className='order-ticket-footer'>
                  <p>🔥 Kitchen Prep: 15-20 mins</p>
                  <p>🚚 Dispatch: Downtown Food Truck</p>
                </div>
              </div>
              <button
                className='btn-primary'
                onClick={onClose}
                style={{ marginTop: '1.5rem', width: '100%' }}
              >
                Back to Menu
              </button>
            </div>
          ) : cartItems.length === 0 ? (
            <div className='cart-empty-state'>
              <span className='empty-icon'>🌮</span>
              <h4>Your Cart is Empty</h4>
              <p>Add some fiery tacos, loaded fries, or burgers from our 20-item menu!</p>
              <button
                className='btn-secondary'
                onClick={onClose}
                style={{ marginTop: '1rem' }}
              >
                Browse Food Menu
              </button>
            </div>
          ) : (
            <div className='cart-items-list'>
              {cartItems.map((item) => (
                <div key={item.id} className='cart-item-row'>
                  <img src={item.imgUrl} alt={item.name} className='cart-item-thumb' />
                  <div className='cart-item-info'>
                    <div className='cart-item-name'>
                      <strong>{item.name}</strong>
                      {item.bestPrice && <span className='cart-best-badge'>🏷️ Best Price</span>}
                    </div>
                    <div className='cart-item-unit-price'>${item.price.toFixed(2)} each</div>
                    <div className='cart-qty-controls'>
                      <button
                        className='btn-qty'
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        aria-label='Decrease quantity'
                      >
                        -
                      </button>
                      <span className='qty-display'>{item.quantity}</span>
                      <button
                        className='btn-qty'
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        aria-label='Increase quantity'
                      >
                        +
                      </button>
                      <button
                        className='btn-remove-item'
                        onClick={() => onRemoveItem(item.id)}
                        aria-label='Remove item'
                        title='Remove item'
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                  <div className='cart-item-subtotal'>
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!orderConfirmed && cartItems.length > 0 && (
          <div className='cart-footer'>
            <div className='cart-summary-line'>
              <span>Subtotal</span>
              <strong>${totalAmount.toFixed(2)}</strong>
            </div>
            <div className='cart-summary-line'>
              <span>Estimated Tax (8.25%)</span>
              <span>${(totalAmount * 0.0825).toFixed(2)}</span>
            </div>
            <div className='cart-total-line'>
              <span>Total</span>
              <span className='cart-total-price'>${(totalAmount * 1.0825).toFixed(2)}</span>
            </div>

            <div className='cart-footer-actions'>
              <button className='btn-clear-cart' onClick={onClearCart}>
                Clear Cart
              </button>
              <button
                className='btn-checkout'
                onClick={onCheckout}
                disabled={isCheckingOut}
              >
                {isCheckingOut ? 'Processing...' : 'Complete Order 🌶'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartModal;
