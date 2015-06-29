define([
    'jquery',
    'knockout'
], function($, ko) {

    ko.bindingHandlers.customScroll = {
        init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            var value = valueAccessor();
            var customScroll;
            setTimeout(function (element, value) {
                customScroll = CustomHTMLScroll(element);
                customScroll.setup();
            }, 0, element, value);
            var foreach = allBindings().foreach;
            foreach.subscribe(function() {
                if(!customScroll) return;
                customScroll.refresh();
            });
        }
    };

    /*
     * Quick and dirty hack based on
     * https://github.com/davidmaes/lib-customhtmlscroll/blob/master/customhtmlscroll.js
     */
    function CustomHTMLScroll( content )
    {
        var scroll = {};

        var scrollPane = null;
        var scrollBar = null;

        var viewportHeight = 0;
        var scrollPaneHeight = 0;
        var scrollBarHeight = 0;

        var scrollTopMax = 0;
        var scrollBarMargins = 4;

        var startY = 0;
        var scrollSpeed = 30;
        var scrolling = false;

        scroll.setup = setup;
        scroll.refresh = refresh;
        $(window).resize(refresh);

        function setup()
        {
            scrollPane = content.parentNode;
            content.style.overflowY = "hidden";

            calculateProperties();

            setupScrollBar();
            setupScrollEvents();
        }
        function refresh()
        {
            calculateProperties();
            refreshScrollBar();
            adjustScrollBarToContent();
        }

        function calculateProperties()
        {
            viewportHeight = content.offsetHeight;
            scrollPaneHeight = scrollPane.offsetHeight;
            scrollTopMax = content.scrollHeight - viewportHeight;
            scrollBarHeight = calculateScrollbarHeight();
        }

        function calculateScrollbarHeight()
        {
            if(viewportHeight === content.scrollHeight) return 0;

            var perunage = viewportHeight / content.scrollHeight;

            return viewportHeight * perunage - scrollBarMargins * 2;
        }

        function setupScrollBar()
        {
            scrollBar = addElement( scrollPane, "div" );
            scrollBar.className = "scrollBar";
            scrollBar.style.position="absolute";

            refreshScrollBar();
        }
        function refreshScrollBar()
        {
            scrollBar.style.left = content.offsetWidth - scrollBar.offsetWidth - scrollBarMargins + "px";
            scrollBar.style.top = scrollBarMargins + "px";
            scrollBar.style.height = scrollBarHeight + "px";
            scrollBar.style.opacity = 0;
        }

        function setupScrollEvents()
        {
            scrollPane.addEventListener( "mouseover", onShowScrollBar );
            scrollPane.addEventListener( "mouseout", onHideScrollBar );
            scrollPane.addEventListener( "wheel", onWheel );
            content.addEventListener( "touchstart", onTouchStart );
            content.addEventListener( "touchmove", onTouchMove );
            content.addEventListener( "touchend", onTouchEnd );
            scrollBar.addEventListener( "mousedown", onStartDrag );
        }

        function onShowScrollBar()
        {
            refresh();
            scrollBar.style.opacity = 1;
        }

        function onHideScrollBar()
        {
            if( !scrolling )
                scrollBar.style.opacity = 0;
        }

        function onWheel( e )
        {
            var delta = e.deltaY > 0 ? scrollSpeed : -scrollSpeed;
            content.scrollTop += delta;

            adjustScrollBarToContent();

            e.preventDefault();
        }

        function adjustScrollBarToContent()
        {
            var height = content.scrollHeight - viewportHeight;
            var perunage = content.scrollTop / height;
            var top =  scrollBarMargins + ( scrollPaneHeight - scrollBarMargins * 3 - scrollBarHeight ) * perunage;

            scrollBar.style.top = top + "px";
        }

        function onTouchStart( e )
        {
            var touch = e.changedTouches[0];
            startY = parseFloat( touch.clientY );

            onShowScrollBar();

            e.preventDefault();
        }

        function onTouchMove( e )
        {
            var touch = e.changedTouches[0];

            content.scrollTop -= parseFloat( touch.clientY ) - startY;
            startY = parseFloat( touch.clientY );

            adjustScrollBarToContent();

            e.preventDefault();
        }

        function onTouchEnd( e )
        {
            onHideScrollBar();
        }

        function onStartDrag( e )
        {
            startY = e.clientY;

            setNodeSelectable( content, false );

            document.addEventListener( "mousemove", onDrag );
            document.addEventListener( "mouseup", onStopDrag );

            //prevents text selection
            e.preventDefault();
        }

        function onDrag( e )
        {
            scrolling = true;

            var top = parseFloat( scrollBar.style.top ) + e.clientY - startY;

            top = Math.max( top, scrollBarMargins );
            top = Math.min( top, scrollPaneHeight - scrollBarHeight - scrollBarMargins * 2 );

            scrollBar.style.top = top + "px";
            startY = e.clientY;

            adjustContentToScollBar();
        }

        function onStopDrag( e )
        {
            scrolling = false;

            setNodeSelectable( content, true );

            document.removeEventListener( "mousemove", onDrag );
            document.removeEventListener( "mouseup", onStopDrag );
        }

        function getPropertiesAreValid()
        {
            if( scrollPaneHeight < contentHeight )
                return true;
            else
                return false;
        }

        function adjustContentToScollBar()
        {
            var perunage = parseFloat( scrollBar.style.top ) / ( scrollPaneHeight - scrollBarHeight - scrollBarMargins * 2 );

            var top = perunage * scrollTopMax;

            content.scrollTop = top;
        }

        function addElement( parent, element )
        {
            var child = document.createElement( element );

            parent.appendChild( child );

            return child;
        }

        function setNodeSelectable( node, value )
        {
            if( node.nodeType != 1 )
                return;

            if( value )
                node.removeAttribute("unselectable");
            else
                node.setAttribute("unselectable", "on");

            var children = node.childNodes;

            for( var i = 0; i < children.length; i++ )
                setNodeSelectable( children[i], value );
        }


        return scroll;
    }

});

