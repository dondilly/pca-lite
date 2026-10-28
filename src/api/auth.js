const LOGIN_ENDPOINT = 'http://localhost:8080/Inventory/api/login'
const BRANCH_LOGIN_ENDPOINT =
  'http://localhost:8080/Inventory/api/dashboard/loginToBranchApi'
let token = ''
let selectedBranchId = null

export function getSelectedBranch() {
  return selectedBranchId
}

async function readResponse(response, failureMessage) {
  let data
  try {
    data = await response.json()
  } catch {
    throw new Error('The server returned an invalid response.')
  }

  if (!response.ok) {
    throw new Error(data.message || `${failureMessage} (${response.status}).`)
  }

  return data
}

export async function login(username, password) {
  const response = await fetch(LOGIN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  })

  const data = await readResponse(response, 'Login failed')

  console.log('Login response data:', data) // Log the entire response data for debugging


  if (typeof data.access_token !== 'string' || !data.access_token) {
    throw new Error('The login response did not include a token.')
  }

  if (!Array.isArray(data.branches)) {
    throw new Error('The login response did not include a branch list.')
  }
  token = data.access_token

  return data
}

export async function loginToBranch(branchId, token) {
  const endpoint = new URL(BRANCH_LOGIN_ENDPOINT)
  endpoint.searchParams.set('branch', branchId)

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const data = await response.json();//readResponse(response, 'Branch login failed')
  
  console.log('Branch login response data:', data) // Log the entire response data for debugging
  if (typeof token !== 'string' || !token) {
       throw new Error('The branch login response did not include a token.')
  }

  selectedBranchId = branchId
  return data
}


export async function getRestData(endpoint, options = {}){
     
     console.log("End Point: " + endpoint)

     const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          ...(options.body !== undefined
            ? { 'Content-Type': 'application/json' }
            : {}),
          Authorization: `Bearer ${token}`,
        },
     })

     const rdata =  await readResponse(response, 'request failed')
     return rdata
}


export async function postRestData(endpoint, options = {}){
     
     console.log("End Point: " + endpoint)

     const response = await fetch(endpoint, {
        method:  options.method ? options.method : 'POST',
        ...(options.body !== undefined
          ? { body: JSON.stringify(options.body) }
          : {}),
        headers: {
          ...(options.body !== undefined
            ? { 'Content-Type': 'application/json' }
            : {}),
          Authorization: `Bearer ${token}`,
        },
     })

     const rdata =  await readResponse(response, 'request failed')
     return rdata
}
