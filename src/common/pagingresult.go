package common

import (
	"math"
)

type PagingResult struct {
	Totaldisplayrecords int           `json:"totaldisplayrecords"`
	Totalrecords        int           `json:"totalrecords"`
	Data                []interface{} `json:"data"`
	Start               int           `json:"start"`
	End                 int           `json:"end"`
	Page                int           `json:"page"`
	Totalpages          int           `json:"totalpages"`
	Sort                []Sort        `json:"sort"`
}

func (c *PagingResult) Calculate(paging *Paging) {
	c.Start = paging.GetStart()
	c.End = c.Start + c.Totaldisplayrecords
	c.Page = paging.GetCurrentPage()
	d := float64(c.Totalrecords) / float64(paging.GetPageSize())
	c.Totalpages = int(math.Ceil(d))
	c.Sort = paging.GetSortArray()
}

func (c *PagingResult) SetTotalRecords(total int) {
	c.Totalrecords = total
}

func (c *PagingResult) SetData(arrData []interface{}) {
	c.Data = arrData
	c.Totaldisplayrecords = len(arrData)
}
