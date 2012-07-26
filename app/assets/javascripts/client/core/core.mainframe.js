/***************************** MainFrame *****************************/
// The browser content frame (body)
Core.MainFrame = new Class.Singleton({
  Extends: Core.StaticActor,
  name: "MainFrame",

  initialize: function(){
    $log('Core.MainFrame: initializing...', {section: 'open'});
    this.parent();
    this.assign(document.body);
    $log('Core.MainFrame: OK', {section: 'close'});
  },

  getActor: function(id){
    var privateFinder = function(id){
      this.actor = null;
      var actorId = id;

      this.traverse = function(actor){
        if(actor.objectId == actorId){
          this.actor = actor;
          return true;
        }
        return actor.children.some(function(child){
          return this.traverse(child);
        }, this);
      }
    }

    var finder = new privateFinder(parseInt(id));
    finder.traverse(this);
    return finder.actor;
  },

  countActors: function(){
    var privateCounter = function(){
      this.count = 0;

      this.traverse = function(actor){
        actor.children.each(function(child){
          this.traverse(child);
        }, this);
        this.count++;
      }
    }

    var counter = new privateCounter;
    counter.traverse(this);
    return counter.count;
  }
});
