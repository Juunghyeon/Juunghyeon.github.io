---
title: "[CPP] bind vs placeholder"
categories: "CPP"
tags: 
    - "CPP"
toc: false
---

# std::bind
bind를 사용하는 이유는 함수에 인자를 **바인딩(함수에 사용될 인자를 매칭시키는 것)**하기 위함이다.

```cpp
#include<iostream>
#include<string>
#include<functional>

using namespace std;

void hello(const string& s)
{
	cout << s << endl;
}

int main()
{
	auto func = std::bind(hello, "hello world");
	func();
}
```
위 코드의 실행 결과는 hello world이다.
즉, func()를 호출하면 hello world가 출력된다.
hello 함수에 "hello world" 라는 인자를 바인딩 해주었기 때문이다.

---
# std::placeholders
placeholders는 **bind에서 사용할 인자를 대체하기 위해** 사용된다.

```cpp
#include<iostream>
#include<string>
#include<functional>

using namespace std;

int sum(int a, int b, int c)
{
	return a + b + c;
}

int main()
{
	auto func1 = std::bind(sum, placeholders::_1, 2, 3);
	cout << func1(1) << endl;

}

// 실행 결과 6
```

```cpp
#include<iostream>
#include<string>
#include<functional>

using namespace std;

int sum(int a, int b, int c)
{
	return a + b + c;
}

int main()

{	
	auto func2 = std::bind(sum, placeholders::_1, placeholders::_2, 3);
	cout << func2(2, 3) << endl;
}

// 실행 결과 8
```