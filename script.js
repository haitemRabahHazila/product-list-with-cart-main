document.addEventListener('DOMContentLoaded', async () => {
  try {
      // Fetch data from our_data.json
      const response = await fetch('our_data.json');
      if (!response.ok) throw new Error('Failed to load menu data');
      const dessertItems = await response.json();

      // Get DOM elements
      const menuItemsContainer = document.querySelector('.menu-items');
      const heading = menuItemsContainer.querySelector('h1');
      const confirmationModal = document.getElementById('confirmation-modal');
      const newOrderBtn = document.getElementById('new-order-btn');
      
      // Clear existing menu items except the heading
      menuItemsContainer.innerHTML = '';
      menuItemsContainer.appendChild(heading);

      // Create menu items
      dessertItems.forEach(item => {
          const menuCard = document.createElement('section');
          menuCard.className = 'menu-card';
          menuCard.dataset.id = item.name.replace(/\s+/g, '-').toLowerCase();

          menuCard.innerHTML = `
              <img src="${item.image.desktop}" 
                   srcset="${item.image.mobile} 480w, 
                           ${item.image.tablet} 768w, 
                           ${item.image.desktop} 1200w"
                   sizes="(max-width: 480px) 480px,
                          (max-width: 768px) 768px,
                          1200px"
                   alt="${item.name}">
              <button class="add-to-cart">
                  <img src="assets/images/icon-add-to-cart.svg" alt="Cart">
                  Add to Cart
              </button>
              <div class="quantity-control">
                  <button class="decrease">-</button>
                  <span class="quantity">1</span>
                  <button class="increase">+</button>
              </div>
              <div class="item-info">
                  <h2 class="item-name">${item.category}</h2>
                  <p class="item-description">${item.name}</p>
                  <p class="item-price">$${item.price.toFixed(2)}</p>
              </div>
          `;

          menuItemsContainer.appendChild(menuCard);
      });

      // Cart functionality
      const cart = {
          items: [],
          get count() {
              return this.items.length;
          },
          get total() {
              return this.items.reduce((sum, item) => sum + item.price, 0);
          }
      };

      // Update cart UI
      function updateCartUI() {
          const cartCountElement = document.getElementById('cart-count');
          const cartItemsElement = document.getElementById('cart-items');
          const cartEmptyElement = document.getElementById('cart-empty');
          const cartTotalsElement = document.getElementById('cart-totals');
          const totalPriceElement = document.getElementById('total-price');

          // Update cart count
          cartCountElement.textContent = cart.count;

          if (cart.count > 0) {
              // Show cart items
              cartEmptyElement.style.display = 'none';
              cartTotalsElement.style.display = 'block';
              
              // Group items by name with quantities
              const itemGroups = {};
              cart.items.forEach(item => {
                  if (!itemGroups[item.name]) {
                      itemGroups[item.name] = { ...item, quantity: 0 };
                  }
                  itemGroups[item.name].quantity++;
              });

              // Display grouped items
              cartItemsElement.innerHTML = Object.values(itemGroups).map(item => `
                  <div class="cart-item">
                      <div class="cart-item-info">
                          <p class="cart-item-name">${item.name}</p>
                          <p class="cart-item-quantity">${item.quantity}x @ $${item.price.toFixed(2)}</p>
                      </div>
                      <p class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</p>
                      <button class="cart-item-remove" data-id="${item.name.replace(/\s+/g, '-').toLowerCase()}">×</button>
                  </div>
              `).join('');

              // Update total
              totalPriceElement.textContent = `$${cart.total.toFixed(2)}`;
          } else {
              // Show empty cart
              cartEmptyElement.style.display = 'block';
              cartTotalsElement.style.display = 'none';
          }
      }

      // Update quantity controls on menu items
      function updateQuantityControls() {
          document.querySelectorAll('.menu-card').forEach(menuCard => {
              const itemName = menuCard.querySelector('.item-description').textContent;
              const addToCartBtn = menuCard.querySelector('.add-to-cart');
              const quantityControl = menuCard.querySelector('.quantity-control');
              const quantityElement = menuCard.querySelector('.quantity');
              
              const itemCount = cart.items.filter(item => item.name === itemName).length;
              
              if (itemCount > 0) {
                  addToCartBtn.style.display = 'none';
                  quantityControl.style.display = 'flex';
                  quantityElement.textContent = itemCount;
                  menuCard.style.border = '2px solid hsl(14, 86%, 42%)';
                  menuCard.style.boxShadow = '0 0 10px rgba(210, 84, 0, 0.3)';
              } else {
                  addToCartBtn.style.display = 'flex';
                  quantityControl.style.display = 'none';
                  menuCard.style.border = 'none';
                  menuCard.style.boxShadow = 'none';
              }
          });
      }

      // Event delegation for menu items
      menuItemsContainer.addEventListener('click', e => {
          const menuCard = e.target.closest('.menu-card');
          if (!menuCard) return;
          
          const itemName = menuCard.querySelector('.item-description').textContent;
          const item = dessertItems.find(item => item.name === itemName);
          if (!item) return;

          // Add to cart button
          if (e.target.closest('.add-to-cart')) {
              cart.items.push({...item});
              updateCartUI();
              updateQuantityControls();
          }
          
          // Increase quantity
          if (e.target.closest('.increase')) {
              cart.items.push({...item});
              updateCartUI();
              updateQuantityControls();
          }
          
          // Decrease quantity
          if (e.target.closest('.decrease')) {
              const index = cart.items.findIndex(i => i.name === itemName);
              if (index >= 0) {
                  cart.items.splice(index, 1);
                  updateCartUI();
                  updateQuantityControls();
              }
          }
      });

      // Remove item from cart
      document.querySelector('.cart').addEventListener('click', e => {
          if (e.target.closest('.cart-item-remove')) {
              const itemId = e.target.closest('.cart-item-remove').dataset.id;
              const index = cart.items.findIndex(item => 
                  item.name.replace(/\s+/g, '-').toLowerCase() === itemId
              );
              if (index >= 0) {
                  cart.items.splice(index, 1);
                  updateCartUI();
                  updateQuantityControls();
              }
          }
          
          // Confirm order
          if (e.target.closest('.confirm-order')) {
              showOrderConfirmation();
          }
      });

      // Show order confirmation
      function showOrderConfirmation() {
          const confirmedItemsElement = document.getElementById('confirmed-items');
          const confirmedTotalElement = document.getElementById('confirmed-total');
          
          // Group items for confirmation display
          const itemGroups = {};
          cart.items.forEach(item => {
              if (!itemGroups[item.name]) {
                  itemGroups[item.name] = { ...item, quantity: 0 };
              }
              itemGroups[item.name].quantity++;
          });

          // Display items in confirmation modal
          confirmedItemsElement.innerHTML = Object.values(itemGroups).map(item => `
              <div class="order-item">
                  <span>${item.name}</span>
                  <span>${item.quantity}x $${item.price.toFixed(2)}</span>
              </div>
          `).join('');

          // Update total
          confirmedTotalElement.textContent = `$${cart.total.toFixed(2)}`;
          
          // Show modal
          confirmationModal.style.display = 'flex';
          
          // Clear cart
          cart.items = [];
          updateCartUI();
          updateQuantityControls();
      }

      // Close confirmation modal
      newOrderBtn.addEventListener('click', () => {
          confirmationModal.style.display = 'none';
      });

      confirmationModal.addEventListener('click', (e) => {
          if (e.target === confirmationModal) {
              confirmationModal.style.display = 'none';
          }
      });

      // Initialize UI
      updateCartUI();
      updateQuantityControls();

  } catch (error) {
      console.error('Error:', error);
      menuItemsContainer.innerHTML += `
          <p class="error">Failed to load menu items. Please try again later.</p>
      `;
  }
});