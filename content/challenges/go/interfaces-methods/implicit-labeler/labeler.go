package main

import "fmt"

type Labeler interface {
	Label() string
}

type Job struct {
	ID string
}

func (job Job) Label() string {
	return "job:" + job.ID
}

func printLabel(value Labeler) {
	fmt.Println(value.Label())
}

func main() {
	printLabel(Job{ID: "42"})
}
