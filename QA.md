QA:
Logout is failing. Returning a 401 unauthorized response

Unresolved:

Resolved Fixes:

1. The function uses the stale form variabled before patchDraft updates the content. I changed the patchDraft to update draft useStates and called the form value after the function ran to get the latest version name.
2. Moved the regenerate function out of DraftDisplay. Placed the 'regenerate' button inside the error message. I display the serer message informing the user whether the content is new or not seperatley in the DraftDisplay
3. Each 401 request was being sent twice because useEffect was calling it twice. Once on mount then again on path change. Changed useEffect to only run on pathchange. Added logic in the try expect block for refresh retry that threw an error if status wasn't 200 or 201 and triggered the except block to displayed login prompt. This is because a 401 response here proves user is unauthenticated. But this login prompt was still displaying on validate-user which could be called anywhere including login / signup screens so I exempted it from this display. Added a condition to ignore the toast display if url was verify-user. Realized that a 401 or 403 after refresh retry check meant that user was authenticated but still lacked permissions so created a seperate "permission denied" toast error for this edge-case.
4. The login toast error appears when retrieving existing jobs and resumes. created a config variable skipErrorToast that ignores this pop-up when specified during the api call. Applied this to all getExisitng functions as well as validate user
5. Logout was returning unauthorized because it requires refresh token in body not cookie. Frontend can't access cookies because httponly so I customized backend to extract token from cookies.
