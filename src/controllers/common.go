package controllers


//users: Admin, Reviewer, Approver
//register all controllers


type AdminController struct {
	
	ParserPath  string
}
type CommonRespond struct {
	Status  int    `json:"status"`
	Message string `json:"message"`
}
type CommonRespond2 struct {
	Status  int         `json:"status"`
	Message interface{} `json:"message"`
}

type LoginRespond struct {
	AuthToken string `json:"token"`
	Username  string `json:"username"`
	UserID    int    `json:"userID"`
	RoleID    int    `json:"roleID"`

	FullName   string `json:"fullName" `
	MobileNo   string `json:"mobileNo"`
	AvatarFile string `json:"avatarFile"`
}
type LoginForm struct {
	Username string `json:"username"`
	Password string `json:"password"`
}
