
(function () {

    var THRESHOLD = 40;
    function syncNavState() {
        var forced = document.body.hasAttribute('data-solid-nav');
        document.body.classList.toggle('nav-scrolled', forced || window.scrollY > THRESHOLD);
    }
    document.addEventListener('scroll', syncNavState, { passive: true });


    function initPills() {
        document.querySelectorAll('.filter-pills').forEach(function (group) {
            group.addEventListener('click', function (e) {
                var pill = e.target.closest('.filter-pill');
                if (!pill || !group.contains(pill)) return;
                group.querySelectorAll('.filter-pill').forEach(function (p) {
                    p.classList.remove('active');
                });
                pill.classList.add('active');
            });
        });
    }


    function initHScroll() {
        document.querySelectorAll('.hscroll').forEach(function (box) {
            var track = box.querySelector('.hscroll-track');
            var prev = box.querySelector('.hscroll-prev');
            var next = box.querySelector('.hscroll-next');
            if (!track) return;

            function step() {
                var item = track.querySelector('.hscroll-item');
                var w = item ? item.getBoundingClientRect().width + 16 : track.clientWidth * 0.8;
                return Math.max(w, track.clientWidth * 0.8);
            }
            function update() {
                var maxScroll = track.scrollWidth - track.clientWidth - 2;
                if (prev) prev.disabled = track.scrollLeft <= 2;
                if (next) next.disabled = track.scrollLeft >= maxScroll;
            }
            if (prev) prev.addEventListener('click', function () {
                track.scrollBy({ left: -step(), behavior: 'smooth' });
            });
            if (next) next.addEventListener('click', function () {
                track.scrollBy({ left: step(), behavior: 'smooth' });
            });
            track.addEventListener('scroll', update, { passive: true });
            window.addEventListener('resize', update);
            update();
        });
    }

    function init() {
        syncNavState();
        initPills();
        initHScroll();
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
