"use client"
import { useUser } from '@clerk/nextjs'
import React, { useCallback, useState, useEffect } from 'react'

export default function Dashboard() {
    const {user} = useUser()
    const [todos,setTodos] = useState<Todo[]>([])
    const [totalPages,setTotalPages] = useState()
    const [currentPage,setCurrentPage] = useState(1)
    const [isSubscribed,setIsSubscribed] = useState(false)
    const [searchTerm,setSearchTerm] = useState("")
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm)
    const [loading,setLoading] = useState(false)

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedSearchTerm(searchTerm)
      }, 300)
      return () => clearTimeout(handler)
    }, [searchTerm])

    const fetchTodos = useCallback(async (page:number) => {
        try {
            setLoading(true)
            const response = await fetch(`/api/todos?page=${page}&search=${debouncedSearchTerm}`)

            if(!response.ok){
                throw new Error("failed to fetch todos")
            }

            const data = await response.json()
            setTodos(data.todos)
            setTotalPages(data.totalPages)
            setCurrentPage(data.currentPage)
            setLoading(false)
        } catch (error) {
            setLoading(false)
            
        }
    } , [debouncedSearchTerm] )

    useEffect(()=>{
        fetchTodos(1)
        fetchSubscriptionStatus()
    },[fetchTodos])

    const fetchSubscriptionStatus = async () => {
        const response = await fetch("/api/subscription")

        if(response.ok){
            const data = await response.json()
            setIsSubscribed(data.isSubscribed)
        }
    }

    const handleAddTodo = async(title:string) => {
        try {
            const response = await fetch("/api/todos",{
                method:"POST",
                headers:{"Content-Type":"application/json"},
                body:title
            },)

            if(!response.ok){
                throw new Error("failed to add todo")
            }

            await fetchTodos(currentPage)
        } catch (error) {
            console.log(error)
        }
    }

    const handleUpdateTodo = async(id:string,completed:boolean)=>{
        try {
            const response = await fetch('/api/todos/${id}',{
                method:"PUT",
                headers:{"Content-Type":"application/json"},
                body: JSON.stringify({ completed })
            })
            
            if(!response.ok){
                throw new Error("failed to update todo")
            }

            await fetchTodos(currentPage)
        } catch (error) {
            console.log(error)
        }
    }

    const handleDeleteTodo = async(id:string)=>{
        const response = await fetch(`/api/todo/${id}`,{
            method:"DELETE"
        })

        if(!response.ok){
            throw new Error("failed to update todo")
        }
        await fetchTodos(currentPage)
    }


  return (
    <div>page</div>
  )
}
