package main

import (
	_ "context"
	"fmt"
	"log"
	_ "os"
	_ "path/filepath"
	"strings"
	_ "time"

	"github.com/kataras/iris/v12"

	_ "io/ioutil"

	_ "gopkg.in/yaml.v2"

	"github.com/getsentry/sentry-go"
	sentryiris "github.com/getsentry/sentry-go/iris"
	_ "github.com/iris-contrib/middleware/jwt"

	_ "teloeditor/common"
	"teloeditor/controllers"
	"teloeditor/core"
)

func globalMiddleware(ctx iris.Context) {
	//ctx.WriteString("#3 .UseGlobal\n")
	ctx.Next()
}

func main() {

	// To initialize Sentry's handler, you need to initialize Sentry itself beforehand
	if err := sentry.Init(sentry.ClientOptions{
		Dsn: "https://6db9e4fd85e54e72b18376b3ea22234e@o89294.ingest.sentry.io/5500321",
		//EnableTracing: true,
		// Set TracesSampleRate to 1.0 to capture 100%
		// of transactions for performance monitoring.
		// We recommend adjusting this value in production,
		//TracesSampleRate: 1.0,
	}); err != nil {
		fmt.Printf("Sentry initialization failed: %v\n", err)
	}

	var c *core.Config = new(core.Config)
	app := iris.New()
	//for production
	// $ go install github.com/go-bindata/go-bindata/v3/go-bindata@latest
	// $ ../bin/go-bindata -fs -prefix "templates" ./templates/...

	// $ go run .
	// html files are not used, you can delete the folder and run the example.
	//buggy can not pass variable to sub template
	//tmpl := iris.HTML(AssetFile(), ".html")
	//for dev
	tmpl := iris.Django("./templates/django", ".html")

	app.RegisterView(tmpl)

	app.Get("/", func(ctx iris.Context) {
		if err := ctx.View("index.html"); err != nil {
			ctx.StatusCode(iris.StatusInternalServerError)
			ctx.Writef(err.Error())
		}
	})

	app.Use(sentryiris.New(sentryiris.Options{
		Repanic: true,
	}))

	app.Use(func(ctx iris.Context) {
		if hub := sentryiris.GetHubFromContext(ctx); hub != nil {
			hub.Scope().SetTag("someRandomTag", "maybeYouNeedIt")
		}
		ctx.Next()
		ctx.Next()
	})

	/*j := jwt.New(jwt.Config{
		// Extract by "token" url parameter.
		//Extractor: jwt.FromParameter("token"),

		ValidationKeyGetter: func(token *jwt.Token) (interface{}, error) {
			return []byte(common.Secret), nil
		},
		SigningMethod: jwt.SigningMethodHS256,
	})*/

	crs := func(ctx iris.Context) {
		ctx.Header("Access-Control-Allow-Origin", "*")
		ctx.Header("Access-Control-Allow-Credentials", "true")

		if ctx.Method() == iris.MethodOptions {
			ctx.Header("Access-Control-Methods", "POST, PUT, PATCH, DELETE, OPTIONS")
			ctx.Header("Access-Control-Allow-Methods ", "POST, PUT, PATCH, DELETE, OPTIONS")
			ctx.Header("Access-Control-Allow-Headers", "Access-Control-Allow-Origin,Content-Type,x-requested-with,authorization,Accept, content-type, X-Requested-With, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, Screen")
			ctx.Header("Access-Control-Max-Age", "86400")
			ctx.StatusCode(iris.StatusNoContent)
			return
		}

		ctx.Next()
	} // or	"github.com/iris-contrib/middleware/cors"

	app.UseRouter(crs)

	app.Favicon("./public/favicon.ico")
	app.HandleDir("/", iris.Dir("./public"))
	//app.RegisterView(iris.HTML("./public", ".html"))
	app.OnErrorCode(iris.StatusNotFound, notFound)
	app.UseGlobal(globalMiddleware)

	//init controller

	var adminCont = new(controllers.AdminController)
	var findInFilesCont = new(controllers.FindInFilesController)
	var AIChatCont = new(controllers.AIChatController)

	var port string
	port = "8080"
	if c.GetConf() == nil {
		panic("No config")
	} else {
		if c.Port != "" {
			log.Println("Port: " + c.Port)
			port = c.Port
		}
		if c.ParserPath != "" {
			p := strings.TrimSuffix(c.ParserPath, "/")

			log.Println("ParserPath: " + p)
			adminCont.ParserPath = p
		}

	}

	API := app.Party("/api")
	{
		API.Get("/test", adminCont.Test)

		API.Get("/files/filetree", adminCont.OpenDir)
		API.Post("/files/read", adminCont.ReadFile)
		API.Post("/files/write", adminCont.WriteFile)
		API.Post("/files/words", adminCont.GetWords)
		API.Post("/files/create", adminCont.CreateFileOrDir)
		API.Post("/files/rename", adminCont.RenameFileOrDir)
		API.Post("/files/delete", adminCont.DeleteFileOrDir)
		API.Post("/files/copy", adminCont.CopyFileOrDir)
		API.Post("/files/move", adminCont.MoveFileOrDir)
		API.Post("/files", adminCont.ListFiles)
		API.Post("/parser", adminCont.Parser)
		API.Post("/definitions", adminCont.Definitions)
		API.Post("/tree-structure", adminCont.TreeStructure)

		//plugins
		//find in files
		API.Post("/plugins/find-in-files/search", findInFilesCont.FindInFiles)
		//ai
		API.Post("/plugins/aichat/analyze", AIChatCont.Analyze)
		API.Post("/plugins/aichat/reset", AIChatCont.Reset)
	}

	app.Listen(":" + port)
}

func notFound(ctx iris.Context) {
	ctx.View("index.html")

}
func login(ctx iris.Context) {
	ctx.ViewData("title", "Login")

	if err := ctx.View("login.html"); err != nil {
		ctx.StatusCode(iris.StatusInternalServerError)
		ctx.Writef(err.Error())
	}

}
