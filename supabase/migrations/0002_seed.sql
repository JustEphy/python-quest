insert into public.lessons (slug, title, lesson_order, content_markdown, xp_reward)
values
  (
    'python-variables',
    'Variables and Data Types',
    1,
    '# Variables

Use variables to store values:

```python
name = "Quest"
age = 3
```
',
    50
  ),
  (
    'python-conditionals',
    'Conditionals',
    2,
    '# Conditionals

Use `if`, `elif`, and `else` to branch logic.
',
    50
  ),
  (
    'python-loops',
    'Loops and Iteration',
    3,
    '# Loops

Use `for` and `while` to repeat work.
',
    60
  )
on conflict (slug) do nothing;

with lesson_one as (
  select id from public.lessons where slug = 'python-variables'
),
lesson_two as (
  select id from public.lessons where slug = 'python-conditionals'
)
insert into public.challenges (lesson_id, title, prompt, starter_code, test_code, expected_output, xp_reward)
values
  (
    (select id from lesson_one),
    'Greet the User',
    'Implement greet(name) that returns "Hello, <name>!"',
    'def greet(name):
    # TODO
    return ""

print(greet("Ada"))
',
    'assert greet("Ada") == "Hello, Ada!"
assert greet("Lin") == "Hello, Lin!"
',
    'Hello, Ada!',
    100
  ),
  (
    (select id from lesson_two),
    'Even or Odd',
    'Implement is_even(n) that returns True if n is even.',
    'def is_even(n):
    # TODO
    return False

print(is_even(10))
',
    'assert is_even(2) is True
assert is_even(3) is False
',
    'True',
    120
  )
on conflict do nothing;
