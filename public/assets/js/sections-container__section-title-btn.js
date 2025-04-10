document.querySelectorAll('.sections-container__section-title-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const content = this.nextElementSibling;
        const isActive = this.classList.toggle('active');
        
        if (isActive) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
});