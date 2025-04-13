// Script to handle navbar style on scroll
window.addEventListener("scroll", function () {
  const navbar = document.getElementById("mainNav");
  if (window.scrollY > 50) {
    navbar.classList.add("navbar-scrolled");
  } else {
    navbar.classList.remove("navbar-scrolled");
  }
});

// Script to handle scroll to top button
document.querySelector(".scroll-top").addEventListener("click", function (e) {
  e.preventDefault();
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
});

// Script to handle sort button functionality
document.addEventListener("DOMContentLoaded", function() {
  const sortButton = document.querySelector(".sort-button");
  if (sortButton) {
    sortButton.addEventListener("click", function() {
      const mapItems = document.querySelectorAll(".map-item");
      const mapItemsArray = Array.from(mapItems);
      const container = document.querySelector(".row");
      
      // Toggle sort direction
      const isAscending = this.innerHTML.includes("Z-A");
      
      if (isAscending) {
        // Sort A-Z
        mapItemsArray.sort((a, b) => {
          const titleA = a.querySelector(".map-item-title").textContent;
          const titleB = b.querySelector(".map-item-title").textContent;
          return titleA.localeCompare(titleB);
        });
        this.innerHTML = '<i class="fas fa-sort-alpha-down me-2"></i> Urutkan A-Z';
      } else {
        // Sort Z-A
        mapItemsArray.sort((a, b) => {
          const titleA = a.querySelector(".map-item-title").textContent;
          const titleB = b.querySelector(".map-item-title").textContent;
          return titleB.localeCompare(titleA);
        });
        this.innerHTML = '<i class="fas fa-sort-alpha-down me-2"></i> Urutkan Z-A';
      }
      
      // Reorder items with animation
      mapItemsArray.forEach((item, index) => {
        setTimeout(() => {
          container.appendChild(item);
          item.style.animation = "none";
          item.offsetHeight; // Trigger reflow
          item.style.animation = "fadeInUp 0.6s ease-out forwards";
        }, index * 100);
      });
    });
  }
  
  // Add hover effect to map items
  const mapItems = document.querySelectorAll(".map-item");
  mapItems.forEach(item => {
    item.addEventListener("mouseenter", function() {
      this.style.transform = "translateY(-10px)";
    });
    
    item.addEventListener("mouseleave", function() {
      this.style.transform = "translateY(0)";
    });
  });
  
  // Add search functionality
  const searchInput = document.querySelector(".search-box input");
  if (searchInput) {
    searchInput.addEventListener("input", function() {
      const searchTerm = this.value.toLowerCase();
      const mapItems = document.querySelectorAll(".map-item");
      
      mapItems.forEach(item => {
        const title = item.querySelector(".map-item-title").textContent.toLowerCase();
        const description = item.querySelector(".map-item-desc").textContent.toLowerCase();
        const category = item.querySelector(".badge-category").textContent.toLowerCase();
        
        if (title.includes(searchTerm) || description.includes(searchTerm) || category.includes(searchTerm)) {
          item.style.display = "block";
          item.style.animation = "fadeInUp 0.6s ease-out forwards";
        } else {
          item.style.display = "none";
        }
      });
    });
  }
  
  // Add smooth scrolling to all links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });
});
