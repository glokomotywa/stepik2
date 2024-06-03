document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("filterForm");
  
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
  
      const formData = new FormData(form);
      const queryString = new URLSearchParams(formData).toString();
  
      try {
        const response = await fetch(`/products?${queryString}`, {
          headers: {
            "X-Requested-With": "XMLHttpRequest"
          }
        });
        const products = await response.json();
        updateProductList(products);
      } catch (err) {
        console.error("Error fetching products:", err);
      }
    });
  
    const updateProductList = (products) => {
      const productList = document.getElementById("productList");
      productList.innerHTML = "";
  
      products.forEach(product => {
        const productItem = document.createElement("li");
        productItem.innerHTML = `
          <h2>${product.name}</h2>
          <p>Price: ${product.price}</p>
          <p>Weight: ${product.weight}</p>
        `;
        productList.appendChild(productItem);
      });
    };
  });
  