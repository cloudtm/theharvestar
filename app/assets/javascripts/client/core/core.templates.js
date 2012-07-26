/* Implementable by any Actor to assign dom from a template. Templetize function accepts 2 parameters:
 * - template: the name of the template (it will search the template by id)
 * - substitutions: hash of optional substitutions.
 * Example:
 *
 * <div id="my-template">
 *   <div class="content">
 *       <span class="text">{message}</span>
 *   </div>
 * </div>
 *
 * You can assign this template like this:
 *
 * templetize('my-template',{message: 'Some text'})
 *
 * it will assign to the actor the following pice of dom:
 *
 *   <div class="content">
 *       <span class="text">Some text</span>
 *   </div>
 **/
Core.Templatable = new Class({

  templetize: function(template, substitution){
    var element = null;
    if(template == 'none'){
      element = jQuery('<div>');
    } else {
      element = $template(template, substitution)
      if(element == null){
        throw "Core.Templatable: no template found for " + template;
      }
    }
    this.assign(element);
  }

});

/********************************************************************************/
// TEMPLATES Factory

/* Finds a tempalte with the passed element id and returns
 * the jquery-ized template with optionally substituted parts.
 * Returns null if no template was found.
 **/
Core.TemplateFactory = new function(){
  this.make = function(templateId, substitutions){
    var template = $("#" + templateId);

    // Returns null to indicate that no template was found
    if(template.length == 0){
      return null;
    }

    // Makes a clone of the template (like a new instance).
    var dom = template.clone().html();

    // Makes substitutions if needed
    if($defined(substitutions)){
      dom = dom.substitute(substitutions);
    }

    // Returns the jquery-ized template
    return $(dom);
  }
}
$template = Core.TemplateFactory.make;
