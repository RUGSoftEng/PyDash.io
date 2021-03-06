Feature: Sign In
To ensure that Authentication and Authorization of PyDash works successfully,
we check to see if only existing users are able to sign in.


Scenario: Signing in successfully as existent verified user
  Given PyDash contains the verified user "W-M" with password "mypass"
  When I visit the Pydash sign in page
  And I enter the username "W-M"
  And I enter the password "mypass"
  And I click the sign in button
  Then I should be on the overview page

Scenario: Signing in without entering anything
  When I visit the Pydash sign in page
  And I click the sign in button
  Then I should see the error 'both fields are required'

Scenario: Signing in as unexistent user
  When I visit the Pydash sign in page
  And I enter the username "unexistent"
  And I enter the password "unexistent"
  And I click the sign in button
  Then I should see the error 'incorrect credentials'

Scenario: Signing in as existent user without password
  Given PyDash contains the user "W-M" with password "mypass"
  When I visit the Pydash sign in page
  And I enter the username "W-M"
  And I click the sign in button
  Then I should see the error 'both fields are required'

Scenario: Signing in as existent user with a wrong password
  Given PyDash contains the user "W-M" with password "mypass"
  When I visit the Pydash sign in page
  And I enter the username "W-M"
  And I enter the password "wrong password"
  And I click the sign in button
  Then I should see the error 'incorrect credentials'

