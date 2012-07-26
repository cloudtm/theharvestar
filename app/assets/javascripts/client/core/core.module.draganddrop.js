/* Modules extension for Gamecore library
 * © Algorithmica 2010
 * */

/*********************************************************************
 *                   MODULES MIXINS (some kind of ...)
 *********************************************************************/
var Module = Module || {};

// Adds drag and drop for an Actor class (refer to jQuery draggable and droppable ui)
Module.DragAndDrop = new Class({
  draganddrop: {
    savedCursorStyle: null, // Records the cursor assigned to the dragged element to restore it after drag
    handle: null  // The element that handles the drag
  },

  // Adds dragging functionality to the Actors setting properly cursor
  draggable: function(options){
    options = options || {};
    options.cursor = options.cursor || 'move';

    if(options.handle){
      this.draganddrop.handle = this.element.find(options.handle).first();
    } else {
      this.draganddrop.handle = this.element;
    }
    this.element.draggable(options);
    if(this.draganddrop.handle){
      this.draganddrop.savedCursorStyle = this.draganddrop.handle.css('cursor');
      this.draganddrop.handle.css({
        cursor: 'move'
      });
    }
  },

  // Removes dragging functionality to the Actor and resoters cursor
  stopDragging: function(){
    this.element.draggable('destroy');
    var cursorStyle = null;
    if(this.draganddrop.savedCursorStyle) cursorStyle = this.draganddrop.savedCursorStyle;
    if(this.draganddrop.handle) this.draganddrop.handle.css({
      cursor: cursorStyle
    });
  },

  isDraggable: function(){
    return (this.element.draggable('option','disabled') ? false : true);
  },

  droppable: function(options){
    this.element.droppable(options);
  },

  setDroppableScope: function(scope){
    this.element.setDroppableScope(scope);
  },

  // options: {active: activeClass, hover: hoverClass}
  setDroppableHighlight: function(options){
    if(options.active) this.element.droppable('option', 'activeClass', options.active);
    if(options.hover) this.element.droppable('option', 'hoverClass', options.hover);
  }
});

/*********************************************************************************/

/* BUG Attention: scope option doesn't work in jQuery:
 * bug: http://forum.jquery.com/topic/draggable-droppable-scope-bug
 * solution: http://jsbin.com/ucace4/2/edit
 * Fixing hack: */
jQuery.fn.extend({
  setDroppableScope: function(scope) {
    return this.each(function() {
      var currentScope = jQuery(this).droppable("option","scope");
      if (typeof currentScope == "object" && currentScope[0] == this) return true; //continue if this is not droppable

      //Remove from current scope and add to new scope
      var i, droppableArrayObject;
      for(i = 0; i < jQuery.ui.ddmanager.droppables[currentScope].length; i++) {
        var ui_element = jQuery.ui.ddmanager.droppables[currentScope][i].element[0];

        if (this == ui_element) {
          //Remove from old scope position in jQuery's internal array
          droppableArrayObject = jQuery.ui.ddmanager.droppables[currentScope].splice(i,1)[0];
          //Add to new scope
          jQuery.ui.ddmanager.droppables[scope] = jQuery.ui.ddmanager.droppables[scope] || [];
          jQuery.ui.ddmanager.droppables[scope].push(droppableArrayObject);
          //Update the original way via jQuery
          jQuery(this).droppable("option","scope",scope);
          break;
        }
      }
    });
  }
});
