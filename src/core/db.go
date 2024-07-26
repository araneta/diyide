package core

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/satori/go.uuid"
	"gorm.io/driver/postgres"
	"gorm.io/gen"
	"gorm.io/gorm"
)

type DBAdapter struct {
	DB *gorm.DB
}

//https://medium.com/@the.hasham.ali/how-to-use-uuid-key-type-with-gorm-cc00d4ec7100
// Base contains common columns for all tables.
type Base struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;"`
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt *time.Time `sql:"index"`
}

// BeforeCreate will set a UUID rather than numeric ID.
/*
func (base *Base) BeforeCreate(scope *gorm.Scope) error {
	uuid, err := uuid.NewV4()
	if err != nil {
		return err
	}
	return scope.SetColumn("ID", uuid)
}*/
/*
func (u *DetailTransLog) BeforeCreate(tx *gorm.DB) (err error) {
	uuid := uuid.NewV4()
	if err != nil {
		return err
	}
	u.ID = uuid
	return
}
*/

func (e *DBAdapter) Init(host string, port int,
	dbuser string, dbpassword string, dbname string,
	schema string, timezone string) {
	//loc, _ := time.LoadLocation(timezone) // handle any errors!
	os.Setenv("TZ", timezone)
	fmt.Println("Timezone:")
	fmt.Println(timezone)
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%d search_path=%s sslmode=disable TimeZone=%s", host, dbuser, dbpassword, dbname, port, schema, timezone)
	fmt.Println("Dsn:" + dsn)
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		panic("failed to connect database")
	}
	e.DB = db
	var currentSchema string
	rows, err := db.Debug().Raw("show search_path").Rows()
	rows.Next() // to get the first and only result
	rows.Scan(&currentSchema)
	fmt.Printf("Search Path: %v\n", currentSchema)
	//e.DB.AutoMigrate(&MasterTransLog{}, &DetailTransLog{})

}

func (e *DBAdapter) Create(value interface{}) *gorm.DB {
	return e.DB.Create(value)
}

func (e *DBAdapter) Where(query interface{}, args ...interface{}) *gorm.DB {
	return e.DB.Where(query, args...)
}

func (e *DBAdapter) Update(value interface{}) *gorm.DB {
	fmt.Printf("save: %v\n", value)
	return e.DB.Save(value)
}
func (e *DBAdapter) Delete(value interface{}, conds ...interface{}) *gorm.DB {
	fmt.Printf("delete: %v\n", value)
	return e.DB.Delete(value, conds...)
}

func (e *DBAdapter) Raw(sql string, values ...interface{}) *gorm.DB {
	return e.DB.Raw(sql, values...)
}

func (e *DBAdapter) ScanRows(rows *sql.Rows, dest interface{}) error {
	return e.DB.ScanRows(rows, dest)
}
func (e *DBAdapter) Find(value interface{}) *gorm.DB {
	return e.DB.Find(value)
}
func (e *DBAdapter) Select(table string, bind map[string]string,
	boolOperator string, order map[string]string, limit int, offset int) *gorm.DB {
	var sql string
	var where []string
	var prm = make(map[string]interface{})
	for col, value := range bind {
		var cleanCol = strings.Replace(col, "\"", "", -1)
		where = append(where, fmt.Sprintf("%s = @%s", col, cleanCol))
		prm[cleanCol] = value
	}
	if len(where) > 0 {
		sql = fmt.Sprintf("SELECT * FROM %s WHERE %s ", table, strings.Join(where, " "+boolOperator+" "))
	} else {
		sql = fmt.Sprintf("SELECT * FROM %s ", table)
	}

	log.Println(sql)
	norder := len(order)
	if norder > 0 {
		sql += " ORDER BY "
		var iorder int = 0
		x := norder - 1
		for k, v := range order {
			sql += k + " " + v
			if iorder < x {
				sql += ", "
			}
			iorder++
		}
	}

	if limit > 0 {
		sql += fmt.Sprintf(" LIMIT %d", limit)
	}
	if offset > 0 {
		sql += fmt.Sprintf(" OFFSET %d", offset)

	}

	return e.DB.Raw(sql, prm)

}

/*
type MakanDitempatQuerier interface {
	// SELECT * FROM @@table where status is null or (status is not null and status <> 6)
	GetMakanDitempatList() ([]*gen.T, error)

	// SELECT * FROM vMakanDitempat
	GetMakanDitempatView() ([]*gen.T, error)
}
*/
func (e *DBAdapter) GenerateModels() {
	g := gen.NewGenerator(gen.Config{
		OutPath: "./query",
		Mode:    gen.WithoutContext | gen.WithDefaultQuery | gen.WithQueryInterface, // generate mode
		//Mode: gen.WithoutContext,
	})

	g.UseDB(e.DB) // reuse your gorm db
	g.ApplyBasic(
		// Generate structs from all tables of current database
		g.GenerateAllTable()...,
	)
	// Apply the interface to existing `User` and generated `Employee`
	//g.ApplyInterface(func(MakanDitempatQuerier) {}, g.GenerateModel("makan_ditempat"))

	// Generate the code
	g.Execute()
}
