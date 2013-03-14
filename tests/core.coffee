$(document).ready ->
  test "Check requirements", ->
    expect 2
    ok jQuery?, "jQuery"
    ok ace?, "Ace"
		
  test "Check Angles Namespace", ->
    expect 1
    ok Angles?, "Angles namespace defined"
		
