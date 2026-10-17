Feature: Rate limiting
  The platform enforces daily LLM call limits to protect against unexpected costs.
  A hard global cap prevents any LLM call once exhausted.

  Scenario: First call of the day is allowed
    Given the rate limit table exists
    When a call is made
    Then the call is allowed
