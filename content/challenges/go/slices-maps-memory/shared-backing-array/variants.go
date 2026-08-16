package main

import "fmt"

func main() {
	base := make([]int, 2, 4)
	base[0], base[1] = 10, 20

	first := append(base, 30)
	second := append(base, 40)

	fmt.Println(first)
	fmt.Println(second)
}
