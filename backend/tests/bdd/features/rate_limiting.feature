Feature: Rate limiting
  The platform enforces daily LLM call limits to protect against unexpected costs.
  A hard global cap prevents any LLM call once exhausted, regardless of user.

  Scenario: First call of the day is allowed
    Given the rate limit table exists
    When a user makes a call
    Then the call is allowed
