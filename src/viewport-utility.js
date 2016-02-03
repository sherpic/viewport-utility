const $ = require('jquery');
const merge = require('lodash.merge');


// the object
module.exports = {
    root: $('[data-viewport]'),
    toolbar: $('[data-viewport-toolbar]'),
    vhItems: $('[data-viewport-vh]'),
    scrollLinks: $('[data-viewport-scroll]'),
    lang: 'en',
    // Default config
    config: {
        scrollOffset: 0,
        small: 768,
        start: 0,
        end: 0,
    },
    // Props
    height: 0,
    width: 0,
    start: 0,
    end: 0,
    state: {
        disabledScroll : false,
        small: false,
        large : false,
        scrolling: false,
        start: false,
        end: false,
        loaded: false,
    },
    orientation: {
        portrait: false,
        landscape: false,
    },
    direction: {
        down: false,
        up: false,
    },
    // Internal functions, vars
    _lastPosition: 0,
    _readConfigFromDom() {
        this.lang = document.documentElement.lang ? document.documentElement.lang.toLowerCase() : 'en';
        Object.keys(this.config).map( (key) => {
            let attribute = `viewport-${key.toLowerCase()}`;
            let value = parseInt(this.root.data(attribute));
            if (value > 0) this.config[key] = value;
        });
        return this;
    },
    _addToolbar(){
        return this.toolbar.size() ? this.toolbar.outerHeight() : 0;
    },
    _executeScroll(offsetY) {
        this.state.scrolling = true;
        this.root.addClass('$viewport-scrolling');
        offsetY = offsetY - this.config.scrollOffset - this._addToolbar();
        let viewport = this;
        $('body,html').animate({ scrollTop: offsetY }, '5000', 'swing', function () {
            viewport.state.scrolling = false;
            viewport.root.removeClass('$viewport-scrolling');
            viewport._afterScroll();
        });
        return this;
    },
    _afterScroll() {
        // only do stuff if we need to watch scroll
        if (!this.state.scrolling) {
            this.start = $(window).scrollTop();
            this.end = this.start + this.height;
            this.state.started = this.start > this.config.start;
            this.state.ended = this.end > $(document).height() - this.config.end;

            clearTimeout(this.directionTimeOut);
            this.directionTimeOut = setTimeout( () => {
                this._setDirection();
            }, 100);

            this.root
                .toggleClass('$viewport-started', this.state.started)
                .toggleClass('$viewport-ended', this.state.ended);

        }
        return this;
    },
    _afterResize() {
        return this._measure()._fixVH()._afterScroll();
    },
    _setDirection() {
        this.direction.up = this.start < this._lastPosition;

        // edge cases
        if(this.state.ended) this.direction.up = true;
        if(this.start < 1) this.direction.up = false;

        this.direction.down = !this.direction.up;
        this._lastPosition = this.start;
        this.root
            .toggleClass('$viewport-direction-down', this.direction.down)
            .toggleClass('$viewport-direction-up', this.direction.up);
        return this;
    },
    _initHandlers() {
        let viewport = this;
        this.scrollLinks.on('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            let href = $(this).attr('href');
            let whenInView = $(this).data('viewport-scroll') === '' ? true : $(this).data('viewport-scroll');
            viewport.scrollTo(href == '#' ? 0 : $(href), whenInView);
        });
        return this;
    },
    _measure() {
        //measure
        this.height = $(window).height();
        this.width = $(window).width();
        this.orientation.landscape = (this.width / this.height) > 1 ;
        this.orientation.portrait = !this.orientation.landscape;
        this.state.small = this.config.small > this.width;
        this.state.large = !this.state.small;
        this.root
            .toggleClass('$viewport-small', this.state.small)
            .toggleClass('$viewport-large', this.state.large)
            .toggleClass('$viewport-orientation-portrait', this.orientation.portrait)
            .toggleClass('$viewport-orientation-landscape', this.orientation.landscape);
        return this;
    },
    _fixVH() {
        this.vhItems.each((key, value)=>{
            let unit = this.height / 100;
            $(value).outerHeight(Math.round(unit * $(value).data('viewport-vh')));
        });
        return this;
    },
    _assureOffset(target){
        let offsetY = 0;
        if (typeof target === 'string') {
            target = $(target);
        }
        if (target instanceof $ && target.length) {
            offsetY = target.offset().top;
        }
        if (typeof target === 'number') {
            offsetY = target;
        }
        return offsetY;
    },
    // External functions
    isTopInView(target) {
        let offsetY = this._assureOffset(target) - this._addToolbar();
        return offsetY >= this.start && offsetY <= this.end;
    },
    scrollTo(target, whenInView) {
        let offsetY = this._assureOffset(target);
        whenInView = typeof whenInView === 'undefined' ? true : whenInView;
        if (!whenInView && this.isTopInView(offsetY)) {
            return this;
        }
        this._executeScroll(offsetY);
        return this;
    },
    scrollToHash() {
        if (window.location.hash != '') {
            $(window).scrollTop(0);
            this.scrollTo($(window.location.hash));
        }
        return this;
    },
    disableScroll() {
        this.state.disabledScroll = true;
        this.root.css('overflow', 'hidden').addClass('$viewport-disabled-scroll');
        return this;
    },
    enableScroll() {
        this.state.disabledScroll = false;
        this.root.css('overflow', 'initial').removeClass('$viewport-disabled-scroll');
        return this;
    },
    update() {
        this._initHandlers()._afterResize();
        return this;
    },
    init(options) {
        const viewport = this;
        if(options) {
            merge(this, options);
        }

        viewport._readConfigFromDom().update();
        $(window).load(() => {
            viewport.root.removeClass('$viewport-loading').addClass('$viewport-loaded');
            viewport.loaded = true;
        }).scroll(() => {
            viewport._afterScroll();
        }).resize(() => {
            viewport._afterResize();
        });
        return this;
    },
};
