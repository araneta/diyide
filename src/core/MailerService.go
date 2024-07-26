package core

import (
	"bytes"
	"html/template"
	"log"
	_ "strings"

	"gopkg.in/gomail.v2"
)

type MailerService struct {
	SMTPHost     string
	SMTPPort     int
	SMTPUsername string
	SMTPPassword string
}

func (e *MailerService) Init(host string, port int,
	user string, password string) {
	e.SMTPHost = host
	e.SMTPPort = port
	e.SMTPUsername = user
	e.SMTPPassword = password
}
func (e *MailerService) SendMail(to []string, cc string, sender, subject, message, attachmentFilePath string) error {
	log.Println("SendMail")
	mailer := gomail.NewMessage()
	mailer.SetHeader("From", sender)
	log.Println("SendMail1")
	addresses := make([]string, len(to))
	for i, recipient := range to {
		addresses[i] = mailer.FormatAddress(recipient, "")
	}

	mailer.SetHeader("To", addresses...)

	mailer.SetAddressHeader("Cc", cc, "")

	mailer.SetHeader("Subject", subject)
	mailer.SetBody("text/html", message)
	if attachmentFilePath != "" {
		mailer.Attach(attachmentFilePath)
	}
	log.Println("SendMail2")
	dialer := gomail.NewDialer(
		e.SMTPHost,
		e.SMTPPort,
		e.SMTPUsername,
		e.SMTPPassword,
	)
	log.Println("SendMail3")
	err := dialer.DialAndSend(mailer)
	if err != nil {
		log.Fatal(err.Error())
		return err
	}

	log.Println("Mail sent!")
	return nil
}
func (e *MailerService) ParseTemplate(templateFileName string, data interface{}) (string, error) {
	t, err := template.ParseFiles(templateFileName)
	if err != nil {
		return "", err
	}
	buf := new(bytes.Buffer)
	if err = t.Execute(buf, data); err != nil {
		return "", err
	}
	return buf.String(), nil
}
