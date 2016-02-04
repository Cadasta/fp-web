// Based on -- https://github.com/heyman/leaflet-areaselect/
//
L.PageComposer = L.Class.extend({
    includes: L.Mixin.Events,

    options: {
        pageHeight: 400,
        minHeight: 80,
        paddingToEdge: 30,
        keepAspectRatio: true,
    },

    offset: new L.Point(0,0),
    dimensions: {
        pageHeight: 100,
    },

    refs: {
      paper_aspect_ratios: {
        letter : {landscape: 1.294, portrait: 0.773, scale: 1},
        a3: {landscape: 1.414, portrait: 0.707, scale: 1.414},
        a4: {landscape: 1.414, portrait: 0.707, scale: 1}
      },
      toolScale: 1,
      zoomScale: 1,
      startZoom: null,
      paperSize: 'letter',
      pageOrientation: 'landscape',
      page_aspect_ratio:  null,
      page_dimensions: {
        width: 0,
        height: 0
      },
      rows: 1,
      cols: 2,
      prevRows: 1,
      prevCols: 2
    },

    initialize: function(options) {
        L.Util.setOptions(this, options);
        this.refs.page_aspect_ratio = this.refs.paper_aspect_ratios[this.refs.paperSize][this.refs.pageOrientation];
        this._width = (this.options.pageHeight * this.refs.page_aspect_ratio) * this.refs.cols;
        this._height = this.options.pageHeight * this.refs.rows;
    },

    //all the same
    addTo: function(map) {
        this.map = map;
        this.refs.startZoom = map.getZoom();
        this._createElements();
        this._render();
        return this;
    },

    remove: function() {
      //removed "move"
      this.map.off("moveend", this._onMapChange);
      //this.map.off("zoomend", this._onMapChange);
      this.map.off("resize", this._onMapResize);

      bottomLeft.x = Math.round((size.x - this.dimensions.width) / 2);
      topRight.y = Math.round((size.y - this.dimensions.height) / 2);
      topRight.x = size.x - bottomLeft.x;
      bottomLeft.y = size.y - topRight.y;

      var sw = this.map.containerPointToLatLng(bottomLeft);
      var ne = this.map.containerPointToLatLng(topRight);

      return new L.LatLngBounds(sw, ne);
    },

    //all the same
    getBounds: function() {
        var size = this.map.getSize();
        var topRight = new L.Point();
        var bottomLeft = new L.Point();

        bottomLeft.x = Math.round((size.x - this._width) / 2);
        topRight.y = Math.round((size.y - this._height) / 2);
        topRight.x = size.x - bottomLeft.x;
        bottomLeft.y = size.y - topRight.y;

        var sw = this.map.containerPointToLatLng(bottomLeft);
        var ne = this.map.containerPointToLatLng(topRight);

        return new L.LatLngBounds(sw, ne);
    },

    _getBoundsPinToCenter: function() {
      var size = this.map.getSize();
      var topRight = new L.Point();
      var bottomLeft = new L.Point();

      bottomLeft.x = Math.round((size.x - this.dimensions.width) / 2);
      topRight.y = Math.round((size.y - this.dimensions.height) / 2);
      topRight.x = size.x - bottomLeft.x;
      bottomLeft.y = size.y - topRight.y;

      var sw = this.map.containerPointToLatLng(bottomLeft);
      var ne = this.map.containerPointToLatLng(topRight);

      return new L.LatLngBounds(sw, ne);
    },

    _updateLocation: function(location){
      var self = this;
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function(){
        if (xhr.readyState === 4 && xhr.status === 200){
          var latlngPoints = JSON.parse(xhr.responseText)[0].boundingbox;

          self.map.fitBounds([
            [latlngPoints[0],latlngPoints[2]],
            [latlngPoints[1],latlngPoints[3]]
          ]);

          self._updateToolDimensions();
          self.fire("change");
        }
      };

      xhr.open("GET", "http://nominatim.openstreetmap.org/search/?format=json&limit=1&q="+location, true);
      xhr.send(null);
    },

    _calculateInitialPositions: function() {
      var size = this.map.getSize();

      var topBottomHeight = Math.round((size.y-this._height)/2);
      var leftRightWidth = Math.round((size.x-this._width)/2);
      this.centerPosition = new L.Point(this.map.getCenter());
      this.nwPosition = new L.Point(leftRightWidth + this.offset.x, topBottomHeight + this.offset.y);
      this.nwLocation = this.map.containerPointToLatLng(this.nwPosition);
      this.bounds = this.getBounds();
    },

    setOrientation: function(x) {

      if (this.refs.paper_aspect_ratios[this.refs.paperSize][x] &&
          this.refs.page_aspect_ratio !== this.refs.paper_aspect_ratios[this.refs.paperSize][x]) {

        this.refs.pageOrientation = x;
        this.refs.page_aspect_ratio = this.refs.paper_aspect_ratios[this.refs.paperSize][x];

        this._updateOrientation();

        // if the flop is outside the map bounds, contain it.
        var mapBds = this.map.getBounds();
        if(!mapBds.contains(this.bounds)) {
          this.map.fitBounds(this.bounds, {animate: false});
        }

        this.fire("change");
      }

      return this;
    },

    getPages: function() {
      return {cols: this.refs.cols, rows: this.refs.rows};
    },

    getPinnedBounds: function() {
      return this.bounds || null;
    },

    _updateOrientation: function(){
      //switch from landscape to portrait
      this.dimensions.height = this.dimensions.cellWidth * this.refs.rows;
      this.dimensions.width = this.dimensions.cellHeight * this.refs.cols;
      // make sure it fits on the screen.
      this._updateToolDimensions();
      // re-calc bounds
      this.bounds = this._getBoundsPinToCenter();
      this._render();
    },

    setPaperSize: function(x) {
      if (this.refs.paper_aspect_ratios[x] || x !== this.refs.paperSize) {
        this.refs.paperSize = x;
        this.refs.page_aspect_ratio = this.refs.paper_aspect_ratios[this.refs.paperSize][this.refs.pageOrientation];

        this._updatePaperSize();
        // if the new size is outside the map bounds, contain it.
        var mapBds = this.map.getBounds();
        if(!mapBds.contains(this.bounds)) {
          this.map.fitBounds(this.bounds, {animate: false});
        }

        this.fire("change");
      }
      return this;
    },

    _updatePaperSize: function(){
      //switch between letter/a3/a4
      this.dimensions.height = ((this.dimensions.width / this.refs.cols) / this.refs.page_aspect_ratio) * this.refs.rows;
      // make sure it fits on the screen.
      this._updateToolDimensions();
      // re-calc bounds
      this.bounds = this._getBoundsPinToCenter();
      this._render();
    },

    _setDimensions: function() {
      this.dimensions.nw = this.map.latLngToContainerPoint(this.bounds.getNorthWest());
      this.dimensions.ne = this.map.latLngToContainerPoint(this.bounds.getNorthEast());
      this.dimensions.sw = this.map.latLngToContainerPoint(this.bounds.getSouthWest());
      this.dimensions.se = this.map.latLngToContainerPoint(this.bounds.getSouthEast());
      this.dimensions.width = this.dimensions.ne.x - this.dimensions.nw.x;
      this.dimensions.height = this.dimensions.se.y - this.dimensions.ne.y;

      this.dimensions.cellWidth = this.dimensions.width / this.refs.cols;
      this.dimensions.cellHeight = this.dimensions.height / this.refs.rows;
    },

    _updateToolDimensions: function() {
      var size = this.map.getSize();
      //to update the numbers displayed in the side menu
      var count = document.getElementsByClassName("number");

      var width = this.dimensions.width / this.refs.prevCols;
      var height = this.dimensions.height / this.refs.prevRows;

      this.dimensions.width = width * this.refs.cols;
      this.dimensions.height = height * this.refs.rows;
      /* ALTERNATE CODE TO KEEP GRID AS BIG AS POSSIBLE AT ALL TIMES. DELETE LINES 223 - 230
      if (this.dimensions.height > size.y - 40) {
        this.dimensions.height = size.y - 40;
        this.dimensions.width = ((this.dimensions.height / this.refs.rows) * this.refs.page_aspect_ratio) * this.refs.cols;
      }
      if (this.dimensions.width > size.x - 40) {
        this.dimensions.width = size.x - 40;
        this.dimensions.height = ((this.dimensions.width / this.refs.cols) / this.refs.page_aspect_ratio) * this.refs.rows;
      }
      */


      if (this.dimensions.height > size.y - 60 || this.dimensions.height < size.y - 70 ) {
        this.dimensions.height = size.y - 60;
        this.dimensions.width = ((this.dimensions.height / this.refs.rows) * this.refs.page_aspect_ratio) * this.refs.cols;
      }
      if (this.dimensions.width > size.x - 60 || this.dimensions.width < size.x - 70 && !this.dimensions.height > size.y - 60 ) {
        this.dimensions.width = size.x - 60;
        this.dimensions.height = ((this.dimensions.width / this.refs.cols) / this.refs.page_aspect_ratio) * this.refs.rows;
      }
      if (this.dimensions.width > size.x - 40) {
        this.dimensions.width = size.x - 40;
        this.dimensions.height = ((this.dimensions.width / this.refs.cols) / this.refs.page_aspect_ratio) * this.refs.rows;
      }
      */



      this.refs.prevCols = this.refs.cols;
      this.refs.prevRows = this.refs.rows;

      count[0].textContent = this.refs.cols;
      count[1].textContent = this.refs.rows;

      this.bounds = this._getBoundsPinToCenter();
      this._render();
    },

    _makePageElement: function(x,y,w,h) {
      var div = document.createElement('div');
      div.className = "page";
      div.style.left = x + "%";
      div.style.top = y + "%";
      div.style.height = h + "%";
      div.style.width = w + "%";
      return div;
    },

    _createPages: function() {
      var cols = this.refs.cols,
          rows = this.refs.rows,
          gridElm = this._grid,
          top = this.dimensions.nw.y,
          left = this.dimensions.nw.x,
          width = this.dimensions.width,
          height = this.dimensions.height;

      L.DomUtil.removeClass(this._container, "one-row");
      L.DomUtil.removeClass(this._container, "one-col");

      if (cols === 1) L.DomUtil.addClass(this._container, "one-col");
      if (rows === 1) L.DomUtil.addClass(this._container, "one-row");

      this._grid.innerHTML = "";
      this._grid.style.top = top + "px";
      this._grid.style.left = left + "px";
      this._grid.style.width = width + "px";
      this._grid.style.height = height + "px";

      var spacingX = 100 / cols,
          spacingY = 100 / rows;

      // cols
      for (var i = 0;i< cols;i++) {
        for (var r = 0;r< rows;r++) {
          var elm = gridElm.appendChild( this._makePageElement(spacingX * i, spacingY * r, spacingX, spacingY ) );

          // adjust borders
          if (r === 0) {
            L.DomUtil.addClass(elm, 'outer-top');
          } else {
            L.DomUtil.addClass(elm, 'no-top');
          }

          if(r == rows-1) {
            L.DomUtil.addClass(elm, 'outer-bottom');
          }

          if (i === 0) {
            L.DomUtil.addClass(elm, 'outer-left');
          } else {
            L.DomUtil.addClass(elm, 'no-left');
          }
          if (i == cols-1) {
            L.DomUtil.addClass(elm, 'outer-right');
          }
        }
      }
    },

        //adds +/-
    _createPageModifiers: function() {
      var gridModifiers = document.getElementsByClassName("grid-modifier");
      this._addRow = gridModifiers[5];
      this._minusRow = gridModifiers[3];
      this._addCol = gridModifiers[2];
      this._subCol = gridModifiers[0];

      L.DomEvent.addListener(this._addRow, "click", this._onAddRow, this);
      L.DomEvent.addListener(this._minusRow, "click", this._onSubtractRow, this);
      L.DomEvent.addListener(this._addCol, "click", this._onAddCol, this);
      L.DomEvent.addListener(this._subCol, "click", this._onSubtractCol, this);
    },

    _createElements: function() {
        if (!!this._container)
          return;

        // base elements
        this._container =   L.DomUtil.create("div", "leaflet-areaselect-container", this.map._controlContainer);
        this._grid =        L.DomUtil.create("div", "leaflet-areaselect-grid", this._container);

        // add/remove page btns
        this._createPageModifiers();

        // add scale btn
        this._createContainerModifiers();

        // add event listeners to menu
        this._calculateInitialPositions();
        this._setDimensions();
        this._createPages();
        this._onSearch();

        this.map.on("move",     this._onMapMovement, this);
        this.map.on("moveend",  this._onMapMovement, this);
        this.map.on("viewreset",  this._onMapReset, this);
        this.map.on("resize",   this._onMapReset, this);

        this._onMapReset();
        this._updateToolDimensions();
    },

    // Adds the scale button
    _createContainerModifiers: function() {
      // scale button
      this._setScaleHandler(L.DomUtil.create("div", "leaflet-areaselect-handle scale-handle", this._container), -1, -1);
    },

    _onAddRow: function(evt) {
      evt.stopPropagation();
      this.refs.rows++;
      this._updatePages();
    },

    _onSubtractRow: function(evt) {
      evt.stopPropagation();
      if (this.refs.rows === 1) return;
      this.refs.rows--;
      this._updatePages();
    },

    _onAddCol: function(evt) {
      evt.stopPropagation();
      this.refs.cols++;
      this._updatePages();
    },

    _onSubtractCol: function(evt) {
      evt.stopPropagation();
      if (this.refs.cols === 1) return;
      this.refs.cols--;
      this._updatePages();
    },

    _updatePages: function() {
      this._setDimensions();
      this._updateToolDimensions();
      this._createPages();
      this.fire("change");
    },

    _updatePageGridPosition: function(left, top, width, height) {
      this._grid.style.top = top + "px";
      this._grid.style.left = left + "px";
      this._grid.style.width = width + "px";
      this._grid.style.height = height + "px";
    },

    _updateGridElement: function(element, dimension) {
        element.style.width = dimension.width + "px";
        element.style.height = dimension.height + "px";
        element.style.top = dimension.top + "px";
        element.style.left = dimension.left + "px";
        element.style.bottom = dimension.bottom + "px";
        element.style.right = dimension.right + "px";
    },

    _onMapMovement: function(){
        this.bounds = this._getBoundsPinToCenter();
        this._render();
        this.fire("change");
    },

    _onMapReset: function() {
      this.fire("change");
    },

    _onMapResize: function() {
        //this._render();
    },

    _onMapChange: function() {
        this.fire("change");
    },

    // Handler for when the tool is scaled
    _setScaleHandler: function(handle, xMod, yMod) {
      if (this._scaleHandle) return;
      xMod = xMod || 1;
      yMod = yMod || 1;

      this._scaleHandle = handle;

      this._scaleProps = {
        x: xMod,
        y: yMod,
        curX: 0,
        curY: 0,
        maxHeight: 0,
        ratio: 1
      };

      L.DomEvent.addListener(this._scaleHandle, "mousedown", this._onScaleMouseDown, this);
    },

    _onScaleMouseMove: function(event) {
      var width = this.dimensions.width,
          height = this.dimensions.height;

      if (this.options.keepAspectRatio) {
        //var maxHeight = (height >= width ? size.y : size.y * (1/ratio) ) - 30;
        height += (this._scaleProps.curY - event.originalEvent.pageY) * 2 * this._scaleProps.y;
        height = Math.max(this.options.minHeight, height);
        height = Math.min(this._scaleProps.maxHeight, height);
        width = height * this._scaleProps.ratio;

      } else {
        this._width += (this._scaleProps.curX - event.originalEvent.pageX) * 2 * this._scaleProps.x;
        this._height += (this._scaleProps.curY - event.originalEvent.pageY) * 2 * this._scaleProps.y;
        this._width = Math.max(this.options.paddingToEdge, this._width);
        this._height = Math.max(this.options.paddingToEdge, this._height);
        this._width = Math.min(size.x-this.options.paddingToEdge, this._width);
        this._height = Math.min(size.y-this.options.paddingToEdge, this._height);
      }

      this.dimensions.width = width;
      this.dimensions.height = height;

      this._scaleProps.curX = event.originalEvent.pageX;
      this._scaleProps.curY = event.originalEvent.pageY;

      this.bounds = this._getBoundsPinToCenter();
      this._setDimensions();
      this._render();
    },

    _onScaleMouseDown: function(event) {
      //event.stopPropagation();
      L.DomEvent.stopPropagation(event);
      L.DomEvent.removeListener(this._scaleHandle, "mousedown", this._onScaleMouseDown);

      this._scaleProps.curX = event.pageX;
      this._scaleProps.curY = event.pageY;
      this._scaleProps.ratio = this.dimensions.width / this.dimensions.height;
      var size = this.map.getSize();
      L.DomUtil.disableTextSelection();
      L.DomUtil.addClass(this._container, 'scaling');


      if (this.dimensions.width > this.dimensions.height){
        var ratio = this.dimensions.width / this.dimensions.height;
        var maxHeightY = (size.x / ratio) - 20;
        this._scaleProps.maxHeight = maxHeightY;
      } else {
        this._scaleProps.maxHeight = size.y - 20;
      }

      L.DomEvent.addListener(this.map, "mousemove", this._onScaleMouseMove, this);
      L.DomEvent.addListener(this.map, "mouseup", this._onScaleMouseUp, this);
    },

    _onScaleMouseUp: function(event) {
      L.DomEvent.removeListener(this.map, "mouseup", this._onScaleMouseUp);
      L.DomEvent.removeListener(this.map, "mousemove", this._onScaleMouseMove);
      L.DomEvent.addListener(this._scaleHandle, "mousedown", this._onScaleMouseDown, this);
      L.DomUtil.enableTextSelection();
      L.DomUtil.removeClass(this._container, 'scaling');
      this.fire("change");
    },

    _onSearch: function(){
      var form = document.forms['map-location-search'];
      var self = this;

      L.DomEvent.addListener(form, "submit", function(e){
        L.DomEvent.preventDefault(e);
        self._updateLocation(form.searchBox.value);
        }, self);
    },

    _onPaperSizeChange: function(){
      var form = document.getElementById("atlas_paper_size");
      var self = this;

      L.DomEvent.addListener(form, "change", function(){
        self._setPaperSize(this[this.selectedIndex].value);
      });
    },
    
    _render: function() {
      var size = this.map.getSize();

      if (!this.nwPosition) {
          this._calculateInitialPositions();
      }

      this._setDimensions();

      var nw = this.dimensions.nw,
        ne = this.dimensions.ne,
        sw = this.dimensions.sw,
        se = this.dimensions.se,
        width = this.dimensions.width,
        height = this.dimensions.height,
        rightWidth = size.x - width - nw.x,
        bottomHeight = size.y - height - nw.y;

      this._updatePageGridPosition(nw.x, nw.y, width, height);

      // position handles
      this._updateGridElement(this._scaleHandle, {left:nw.x + width, top:nw.y + height});

    },
});

L.pageComposer = function(options) {
    return new L.PageComposer(options);
};
