Feature: Chatting with the keeper
  The player's messages go from the browser through the API Gateway
  /{proxy+} route to the game Lambda. The Lambda calls the LLM with the
  session's context as the system prompt, with the real secret filled in.

  The stack under test runs with LLM_PROVIDER=mock. The mock replies with
  hardcoded pirate lines and never repeats the system prompt. It records
  each call's system prompt and user text in the test-only DynamoDB table
  rumpelstiltskin-llm-calls, so steps can check what the Lambda received.

  Background:
    Given the player has started a game

  Scenario Outline: Submitted text makes it through the proxy unchanged
    When the player sends the message <message>
    Then the request goes to the API Gateway proxy route for the session
    And the recorded LLM call's user text is the message <message> unchanged

    Examples:
      | message                                       |
      | "What's the password, matey?"                 |
      | "¿Dónde está el tesoro? 🏴‍☠️"                  |
      | "Line one\nLine two, typed with Shift+Enter"  |

  Scenario: A message runs the Lambda with the session's context
    When the player sends the message "Tell me a story"
    Then exactly one LLM call is recorded for the session
    And its system prompt is the pirate context with the session's secret filled in
    And its user text is exactly "Tell me a story"

  Scenario Outline: Blank messages can't be sent
    When the player types <input> into the message box
    Then the send button is disabled
    And pressing Enter sends no request

    Examples:
      | input |
      | ""    |
      | "   " |

  Scenario: A message over 300 characters can't be sent
    When the player types a message of 301 characters
    Then the message box holds only 300 characters
    And the character count shows "300/300"
