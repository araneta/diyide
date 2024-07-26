package core


type AbstractDataMapper struct{
	entityTable string
	
}


func (m *AbstractDataMapper)FindByID(id int) (error, *BaseEntity){
	return nil, new(BaseEntity)
}
