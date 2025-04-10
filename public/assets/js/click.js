window.addEventListener('click', function(e) {
    var modal = document.getElementById('modal');
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});