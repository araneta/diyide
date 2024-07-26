package core

type BaseEntity struct{
		errors map[string]string
		
		
}

func (base *BaseEntity)AddError(key, message string){
	if val, ok := base.errors[key]; ok {		
		//do something here
		base.errors[key] = val + "<br />"+message
	}else{
		base.errors[key] = message
	}

}
