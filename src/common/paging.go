package common

import (
	"strconv"
	"strings"

	"github.com/kataras/iris/v12"
	"github.com/wk8/go-ordered-map"
)

type Paging struct {
	Filter     string
	filter2    string
	pagesize   int
	page       int
	Sort       *orderedmap.OrderedMap //map[string]string
	start      int                    //required
	end        int
	validCols  []string
	newsorts2  []Sort
	customData map[string]string
}

func (c *Paging) Init() {
	om := orderedmap.New()
	c.Sort = om
	c.pagesize = 100
	c.page = 1
}

func (c *Paging) BindRequest(ctx iris.Context) {
	spage := ctx.URLParamDefault("page", "1")
	spageSize := ctx.URLParamDefault("page-size", "100")
	ssortCol := ctx.URLParamDefault("sort-col", "id")
	ssortDir := ctx.URLParamDefault("sort-dir", "asc")
	sfilter := ctx.URLParamDefault("filter", "")

	page, errpage := strconv.Atoi(spage)
	if errpage != nil {
		page = 1
	}

	pageSize, errpagesize := strconv.Atoi(spageSize)
	if errpagesize != nil {
		pageSize = 2147483647
	}

	c.SetPage(page)
	c.SetPageSize(pageSize)
	if ssortCol != "" && ssortCol != "undefined" && ssortDir != "" && ssortDir != "undefined" {
		c.Sort.Set(ssortCol, ssortDir)
	}
	if sfilter != "" && sfilter != "undefined" {
		c.Filter = sfilter
	}
}

func (c *Paging) SetPage(p int) {
	c.page = p
	c.Calculate()
}

func (c *Paging) Calculate() {
	//calculate offset
	if c.page > 1 {
		c.start = (c.page - 1) * c.pagesize
	} else {
		c.start = 0
	}
	c.end = c.start + c.pagesize
}

func (c *Paging) SetPageSize(n int) {
	c.pagesize = n
	if c.pagesize == 0 {
		c.pagesize = 100
	}
	c.Calculate()
}

func (c *Paging) SetPageSizeToMax(n int) {
	c.SetPageSize(1000000)
}

func (c *Paging) GetStart() int {
	return c.start
}

func (c *Paging) GetPageSize() int {
	return c.pagesize
}

func (c *Paging) GetCurrentPage() int {
	return c.page
}

func (c *Paging) SetValidColumns(newcols []string) {
	c.validCols = newcols
}

func ArrayKeys(elements map[interface{}]interface{}) []interface{} {
	i, keys := 0, make([]interface{}, len(elements))
	for key, _ := range elements {
		keys[i] = key
		i++
	}
	return keys
}

func In_array(needle interface{}, hystack interface{}) bool {
	switch key := needle.(type) {
	case string:
		for _, item := range hystack.([]string) {
			if key == item {
				return true
			}
		}
	case int:
		for _, item := range hystack.([]int) {
			if key == item {
				return true
			}
		}
	case int64:
		for _, item := range hystack.([]int64) {
			if key == item {
				return true
			}
		}
	default:
		return false
	}
	return false
}
func (c *Paging) Validate() {
	if len(c.validCols) > 0 && c.Sort.Len() > 0 {
		keys := make([]string, 0, c.Sort.Len())

		// iterating pairs from oldest to newest:
		for pair := c.Sort.Oldest(); pair != nil; pair = pair.Next() {
			keys = append(keys, pair.Key.(string))
		}

		var newsorts = orderedmap.New()
		var newsorts2 []Sort
		for _, v := range c.validCols {
			val := strings.Replace(v, "\"", "", -1)
			for _, k := range keys {
				if k == val {
					order, present := c.Sort.Get(k)
					if present {
						if order != "asc" && order != "desc" {
							order = "asc"
						}
						newsorts.Set(v, order)
						//newsorts2[] = ['sortcol'=>$k, 'sortdir'=>$order];
						var sortx Sort
						sortx.Sortcol = k
						sortx.Sortdir = order.(string)
						newsorts2 = append(newsorts2, sortx)
						break
					}
				}
			}
		}
		c.Sort = newsorts
		c.newsorts2 = newsorts2
	}
}

func (c *Paging) SetSort(col string, dir string) {
	c.Sort.Set(col, dir)
}

func (c *Paging) GetSort() *orderedmap.OrderedMap {
	return c.Sort
}
func (c *Paging) GetSortArray() []Sort {
	return c.newsorts2
}
func (c *Paging) GetFilter() string {
	return c.Filter
}
func (c *Paging) SetCustomData(key string, value string) {
	c.customData[key] = value
}
