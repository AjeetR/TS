import { json } from 'body-parser'
import express, { response } from 'express'
import { createAccount, updateAccount, getAllAccounts, getAccount, deleteAccount } from './controller'

const route = express.Router()

//Get accounts
route.get('/', async (req, res) => {
    const responseData = await getAllAccounts();
    res.send(responseData)
    })

//Get account
route.get('/:accountId', async (req, res) => {
    // const accountId : any = req.params;
    const responseData = await getAccount(req.params);
    res.send(responseData)
    })

//create account
route.post('/', async (req, res) => {
    const accountCreated = await createAccount(req.body)
    res.send(accountCreated)
})

// update account
route.put('/:accountId', (req, res) => {
    const updatedAccount = updateAccount(req)
    res.send(updatedAccount)
})

//delete account
route.delete('/:accountId', (req, res) => {
    const deletedAccount = deleteAccount(req)
    res.send(deletedAccount)
})

export default route

function typeOf(accountData: string): any {
    throw new Error('Function not implemented.')
}

