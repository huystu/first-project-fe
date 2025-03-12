document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.container');
    const yesBtn = document.querySelector('.yes-btn');
    const noBtn = document.querySelector('.no-btn');
    const yesLink = document.querySelector('#yes-link');
    
    let clickCount = 0;
    const growthFactor = 1.2; // Increase size by 20% each click
  
    function getRandomPosition() {
      const containerRect = container.getBoundingClientRect();
      const btnRect = noBtn.getBoundingClientRect();
      
      const maxX = containerRect.width - btnRect.width;
      const maxY = containerRect.height - btnRect.height;
      
      const randomX = Math.random() * maxX;
      const randomY = Math.random() * maxY;
      
      return { x: randomX, y: randomY };
    }
  
    noBtn.addEventListener('click', () => {
      clickCount++;
      
      // Expand yes button with increasing size
      yesBtn.classList.add('expanded');
      yesLink.style.position = 'static';
      
      // Calculate new sizes based on click count
      const newPadding = 2 * Math.pow(growthFactor, clickCount);
      const newFontSize = 2.4 * Math.pow(growthFactor, clickCount);
      const newMinWidth = 240 * Math.pow(growthFactor, clickCount);
      
      // Apply new sizes
      yesBtn.style.padding = `${newPadding}rem ${newPadding * 2}rem`;
      yesBtn.style.fontSize = `${newFontSize}rem`;
      yesBtn.style.minWidth = `${newMinWidth}px`;
      
      // Make no button smaller and move it
      noBtn.classList.add('shrinking');
      const newPos = getRandomPosition();
      noBtn.style.left = `${newPos.x}px`;
      noBtn.style.top = `${newPos.y}px`;
      
      // Make no button smaller with each click
      const noButtonScale = Math.pow(0.9, clickCount); // Reduce to 90% of size each click
      noBtn.style.transform = `scale(${noButtonScale})`;
    });
  });