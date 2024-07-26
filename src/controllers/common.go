package controllers


//users: Admin, Reviewer, Approver
//register all controllers


type AdminController struct {
	
	UserImagesPath  string
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

type SignUpForm struct {
	FirstName string `json:"firstName" `
	LastName  string `json:"lastName" `
	MobileNo  string `json:"mobileNo"`
	Email     string `json:"email"` //email
	Password  string `json:"password"`
}

type ConfirmationForm struct {
	UserID int    `json:"userID" `
	Email  string `json:"email"` //email
}

type ForgotPasswordForm struct {
	Email string `json:"email"` //email
}

type ValidateForgottenPasswordCodeForm struct {
	Code        string `json:"code"`
	NewPassword string `json:"newPassword"`
}
