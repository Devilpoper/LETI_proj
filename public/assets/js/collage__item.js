document.querySelectorAll('.collage__item').forEach(function(item) {
    item.addEventListener('click', function() {
        var imgSrc = this.querySelector('.collage__item-image').src;
        var modal = document.getElementById('modal');
        modal.querySelector('.modal__content').src = imgSrc;
        modal.style.display = 'block';
    });
});