package main

import "fmt"

func main() {
	values := make(chan int)
	values <- 42

	fmt.Println(<-values)
}
