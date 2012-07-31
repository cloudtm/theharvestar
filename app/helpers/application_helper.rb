module ApplicationHelper

  def class_for(resource, name)
    unless resource.errors[name].blank?
      "input-container error"
    else
      "input-container"
    end
  end

  def login_error_message
    unless flash[:alert].blank?
      "<span class='error'>#{flash[:alert]}</span>".html_safe
    end
  end

  def error_message(resource, name)
    unless resource.errors[name].blank?
      "<span class='error'>#{name} #{resource.errors[name].join(', ')}</span>".html_safe
    else
      ""
    end
  end

end
