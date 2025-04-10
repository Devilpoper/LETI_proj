window.addEventListener('keydown', function(e) {
    var modal = document.getElementById('modal');
    if (e.key === 'Escape' && modal.style.display === 'block') {
        modal.style.display = 'none';
    }
});