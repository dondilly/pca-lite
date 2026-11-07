const BASE_URL= 'http://localhost:8080/Inventory/api'
const LOGIN_ENDPOINT = `${BASE_URL}/login`
const BRANCH_LOGIN_ENDPOINT =`${BASE_URL}/dashboard/loginToBranchApi`
let token = ''
let selectedBranchId = null

export const api_cradle = {
      getPackageUnits:`${BASE_URL}/general/quantityUnitAsJSON`,
      getItemTypes:`${BASE_URL}/general/itemTypeAsJSON`,
      
      getItems:`${BASE_URL}/general/itemsAsJSON`,
      getCustomers:`${BASE_URL}/general/customersAsJSON`,
      getVendors:`${BASE_URL}/general/vendorsAsJSON`,
      getAccountTypes:`${BASE_URL}/general/accountTypesAsJSON`,
      getAccountGroups:`${BASE_URL}/general/accountGroupsAsJSON`,
      getAccounts:`${BASE_URL}/general/AccountsAsJSON`,
      getBranches:`${BASE_URL}/general/branchesAsJSON`,
      getMainCategories:`${BASE_URL}/general/itemCategoriesAsJSON`,
      getSubCategories:`${BASE_URL}/general/itemSubCategoriesAsJSON`,
      postAccGroupUrl:`${BASE_URL}/accountGroups/saveData`,
      postAccountsUrl:`${BASE_URL}/account/saveData`,
      postItemsUrl:`${BASE_URL}/items/saveData`,
      R2Storage:`${BASE_URL}/r2Storage/upload`,
      postBranchesUrl:`${BASE_URL}/branches/saveData`,
      postVendorsUrl:`${BASE_URL}/vendors/saveData`,    
      postCustomersUrl:`${BASE_URL}/customers/saveData`

}
export const api_reports = {
      salesReport:`${BASE_URL}/report/filteredSales`

}



 


export async function getData(apiUrl) {
  const branchId = getSelectedBranch()
  if (branchId == null) {
    throw new Error('No branch is selected.')
  }

  const endpoint = new URL(
       apiUrl
  )
  endpoint.searchParams.set('X-Branch-Id', String(branchId))

  const response = await getRestData(endpoint)
  const data = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : null

  if (!data) {
    throw new Error('The account response was not a list.')
  }

  return data
}

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
     const isFormData =
       typeof FormData !== 'undefined' && options.body instanceof FormData

     const response = await fetch(endpoint, {
        method:  options.method ? options.method : 'POST',
        ...(options.body !== undefined
          ? {
              body: isFormData
                ? options.body
                : JSON.stringify(options.body),
            }
          : {}),
        headers: {
          ...(options.body !== undefined && !isFormData
            ? { 'Content-Type': 'application/json' }
            : {}),
          Authorization: `Bearer ${token}`,
        },
     })

     const rdata =  await readResponse(response, 'request failed')
     return rdata
}
