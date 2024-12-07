

from django.http import HttpResponse, HttpResponseBadRequest , JsonResponse
from django.shortcuts import get_object_or_404
import json
import re
from .models import User,Category,Items,Cart,Order
from datetime import datetime
from django.contrib.auth import authenticate,login,logout
from django.core.mail import send_mail


# -----------------------------------------------------User-----------------------------------------------

def register_user(request):
    if request.method == 'POST':

        load=json.loads(request.body)
        first_name=load['first_name']
        last_name=load['last_name']
        username = load['username']
        email = load['email']
        password = load['password']
        

        if not username or not email or not email:
            return HttpResponseBadRequest('Missing required fields')
        else:
            if not  re.match("^[a-zA-Z0-9_.-]+$", username):
                return JsonResponse({'message':'Match Your username Requirements'})
            elif not re.match(r'\b[\w\.-]+@[\w\.-]+\.\w{2,4}\b',email):
                return JsonResponse({'message':'Match Your email Requirements'})
            
            elif not re.match(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,15}$",password):
                return JsonResponse({'message':'Match Your Password Requirements'})
        
            else:
                if User.objects.filter(username=username).exists():
                    return JsonResponse({'message':'Username Already exists'})
                elif User.objects.filter(email=email).exists():
                    return JsonResponse({'message':'Email Already exists'})
                else:
                    User.objects.create_user(first_name,last_name,username=username,email=email,password=password)
            
                    subject = 'Registration Successful'
                    message = f'Thank you for registering.\nYour username: {username}'
                    from_email = 'nikhilsinghj80@gmail.com'
                    to_email = [email]
                    send_mail(subject, message, from_email, to_email,fail_silently=False)
                
                    return JsonResponse({'message':'You Are Registered Now'})
                    

    else:
        return JsonResponse({'messege':'Invalid Request Method'},status=400)

       
        
def login_user(request):
    
    if request.method == 'POST':

        load=json.loads(request.body)
        username = load['username']
        password = load['password']
        user=authenticate(username=username,password=password)
       
        if user is not None:
            login(request,user)
            return JsonResponse({'message':'Superuser logged in','is_superuser':user.is_superuser})
            
        else:
            return JsonResponse({'message':'Incorrect Username Or password'},status=401)
        
    else:
        return JsonResponse({'messege':'Invalid Request Method'},status=400)
        

def logout_user(request):   
    
    if request.method == 'GET':
        
        if request.user.is_authenticated:
            logout(request)
            return JsonResponse({'message':'User Logged Out Succesfully'})
        else:
            return JsonResponse({'message':'User Is Not Authenticated'},status=401) 
    else:
        return JsonResponse({'messege':'Invalid Request Method'},status=400)
    

# -----------------------------------------------------Category-----------------------------------------------



def add_category(request):
    if request.method == 'POST':
        if request.user.is_authenticated and request.user.is_superuser:
            
            category_name = request.POST.get('category_name')
            category_image = request.FILES.get('category_image')
            
            
            if not category_name or not category_image :
                return JsonResponse({'message': 'Missing required field'})
            else:
                category,created=Category.objects.get_or_create( category_image=category_image,category_name=category_name )
                if not created:
                    return JsonResponse({'message': 'Category Already exist for this name or image'},status=409)
                else:
                    return JsonResponse({'message': 'Category uploaded successfully'},status=201)
        else:
            return JsonResponse({'message': 'You Are not authenticated'},status=401)
    
    
    
    elif request.method == 'DELETE':
        if request.user.is_authenticated and request.user.is_superuser:
            load = json.loads(request.body)
            category_id=load['category_id']
        
            if not category_id:
                return JsonResponse({'message': 'Missing required field'}, status=400)
            else:
                category = get_object_or_404(Category, id=category_id)
                category.deleted_status = True
                category.save()
            
                related_items = Items.objects.filter(product_category=category)
                related_items.update(deleted_status=True)
            
                return JsonResponse({"message": "Category and related items are deleted"}, status=200)
        else:
            return JsonResponse({'message': 'User not logged in'}, status=401)
    
    
    elif request.method == 'GET':
        if request.user.is_authenticated and request.user.is_superuser:
            category=list(Category.objects.filter(deleted_status=False).values('id','category_name','category_image'))
            return JsonResponse(category,safe=False)
        else:
            return JsonResponse({'message': 'User not logged in'},status=401)   
    
    else:
        return JsonResponse({'messege':'Invalid Request Method'},status=400)


def edit_category(request):
    if request.method == 'POST':
        if request.user.is_authenticated and request.user.is_superuser:
            
            
            id=request.POST.get('id')
            new_category_name = request.POST.get('category_name')
            # print(new_category_name)
            new_category_image = request.FILES.get('category_image')
            # print(new_category_image)
            
                
            if Category.objects.filter(id=id).exists():
                    
                if new_category_name is not None and new_category_image is not None:
                    category=Category.objects.get(id=id)
                    category.category_name=new_category_name
                    category.category_image=new_category_image
                    category.category_edited_date = datetime.now()
                    category.save()
                    return JsonResponse({'message': 'Category updated successfully'})
                elif new_category_image is not None:
                    category=Category.objects.get(id=id)
                    category.category_image=new_category_image
                    category.category_edited_date = datetime.now()
                    category.save()
                    return JsonResponse({'message': 'Category image updated successfully'})
                else:
                    category=Category.objects.get(id=id)
                    category.category_name=new_category_name
                    
                    
                    category.category_edited_date = datetime.now()
                    category.save()
                    return JsonResponse({'message': 'Category name updated successfully'})
            else:
                return JsonResponse({'message': 'No category found for this id'})
        else:
            return JsonResponse({'message': 'User not logged in'}, status=401)
    else:
        return JsonResponse({'messege':'Invalid Request Method'},status=400)
    

def get_category(request):
    if request.method == 'GET':
        
        category=list(Category.objects.filter(deleted_status=False).values('id','category_name','category_image'))
        return JsonResponse(category,safe=False)
       
    else:
        return JsonResponse({'messege':'Invalid Request Method'},status=400)  


# -----------------------------------------------------Items-----------------------------------------------



def add_items(request):
    if request.method == "POST":
        if request.user.is_authenticated and request.user.is_superuser:
            try:
                items_data = {
                
                    "product_category": Category.objects.get(id=int(request.POST.get("product_category"))),
                    "product_name": request.POST.get("product_name"),
                    "price": request.POST.get("price"),
                    "unit": request.POST.get("unit"),
                    "image": request.FILES.get("image"),
                    "product_quantity": request.POST.get("product_quantity"),
                    "description": request.POST.get("description"),
                    "product_expiry_date": request.POST.get("product_expiry_date"),
                    "product_manufacture_date": request.POST.get("product_manufacture_date"),
                }
            
                item = Items(**items_data)
                item.save()

                response_data = {"message": "Item added successfully"}
                return JsonResponse(response_data, status=201)
        
            except Exception as e:
                response_data = {"error": str(e)}
                return JsonResponse(response_data, status=400)
        
    elif request.method == 'DELETE':
        if request.user.is_authenticated and request.user.is_superuser:
            load = json.loads(request.body)
            id=load['id']
        
            if not id:
                return JsonResponse({'message': 'Missing required field'}, status=400)
            else:
                item = Items.objects.get(id=id)
                if Items.objects.filter(id=id).exists():  
                    item.deleted_status = True
                    item.save()
                    return JsonResponse({'message': 'Item deleted successfully'})
                else:
                    return JsonResponse({'message': 'Item id does not exists'})
        else:
            return JsonResponse({'message': 'User not logged in'}, status=401)
    
    elif request.method == 'GET' :
       if request.user.is_authenticated:
        
        id=request.GET.get('id')
        items=list(Items.objects.filter(deleted_status=False,product_category_id=id).values())
        return JsonResponse(items,safe=False)
       else:
            return JsonResponse({'message': 'User not logged in'}, status=401)
    else:
        return JsonResponse({'messege':'Invalid Request Method'},status=400)



def get_item(request):
    if request.method == 'GET' :
        id=request.GET.get('id')
        items=list(Items.objects.filter(deleted_status=False,product_category_id=id).values())
        # items=list(Items.objects.latest('product_added_date'))
        return JsonResponse(items,safe=False)
        # return JsonResponse({'messege':items})
       
    else:
        return JsonResponse({'messege':'Invalid Request Method'},status=400)


def edit_item(request):
    if request.method == "POST":
        try:
            item_id = int(request.POST.get("item_id"))
            try:
                item = Items.objects.get(id=item_id)
                
                
                if request.POST.get("product_category"):
                    item.product_category = Category.objects.get(id=int(request.POST.get("product_category")))
                if request.POST.get("product_name"):
                    item.product_name = request.POST.get("product_name")
                if request.POST.get("price"):
                    item.price = request.POST.get("price")
                if request.POST.get("unit"):
                    item.unit = request.POST.get("unit")
                if request.FILES.get("image"):
                    item.image = request.FILES.get("image")
                if request.POST.get("product_quantity"):
                    item.product_quantity = request.POST.get("product_quantity")
                if request.POST.get("description"):
                    item.description = request.POST.get("description")
                if request.POST.get("product_expiry_date"):
                    item.product_expiry_date = request.POST.get("product_expiry_date")
                if request.POST.get("product_manufacture_date"):
                    item.product_manufacture_date = request.POST.get("product_manufacture_date")

                item.save()

                response_data = {"message": "Item updated successfully"}
                return JsonResponse(response_data, status=200)

            except Items.DoesNotExist:
                response_data = {"message": "Item not found"}
                return JsonResponse(response_data, status=404)

        except Exception as e:
            response_data = {"error": str(e)}
            return JsonResponse(response_data, status=400)
    else:
        return JsonResponse({'message': 'Invalid Request Method'}, status=400)



def get_all_item(request):
    if request.method == 'GET' :
        items=list(Items.objects.filter(deleted_status=False).values('id','product_name','image','description','price','unit','product_category__category_name'))
        return JsonResponse(items,safe=False)
       
    else:
        return JsonResponse({'messege':'Invalid Request Method'},status=405)



# -----------------------------------------------------Cart-----------------------------------------------


       
def add_to_cart(request):
    if request.method == "POST":
        if not request.user.is_authenticated:
            return JsonResponse({'message': 'User not logged in'}, status=401)

        load = json.loads(request.body)
        item_id = load.get('item_id')

        if item_id is None:
            return JsonResponse({'message': 'Item id does not exist'})

        item = Items.objects.filter(pk=item_id,deleted_status=False).first()

        if item is None:
            return JsonResponse({'message': 'Item matching query does not exist'}, status=404)

        # category = item.product_category

        cart_item, created = Cart.objects.get_or_create(user=request.user, item=item,deleted_status=False)

        if not  created:
            return JsonResponse({'message': 'Item already in cart'}, status=200)
            
        else:
            cart_item.quantity = 1
            cart_item.save()
            return JsonResponse({'message': 'Item added to cart'})
   
           

        

        

    
    
    
    elif request.method == "GET":
        if not request.user.is_authenticated:
            return JsonResponse({'message': 'User not logged in'}, status=401)

        cart_items = Cart.objects.filter(user=request.user,item__deleted_status=False,deleted_status=False).values(
            'item__pk',
            'item__product_name',
            'item__price',
            'item__image',  
            'quantity'
        )

        return JsonResponse(list(cart_items), safe=False)
    
    
    elif request.method == 'DELETE':
        if request.user.is_authenticated:
            load = json.loads(request.body)
            item_id=load['item_id']
        
            if not item_id:
                return JsonResponse({'message': 'Missing required field'}, status=400)
            else:
                cart = Cart.objects.filter(item_id=item_id)
                if Cart.objects.filter(item_id=item_id).exists():  
                    cart.update(deleted_status = True)
                    # cart.save()
                    return JsonResponse({'message': 'Cart deleted successfully'})
                else:
                    return JsonResponse({'message': 'Item id does not exists'})
        else:
            return JsonResponse({'message': 'User not logged in'}, status=401)

        
    
    else:
        return JsonResponse({'message': 'Invalid Request Method'}, status=405)



# -----------------------------------------------------Order-----------------------------------------------



def buy_item(request):

    if request.method == 'POST':
        if request.user.is_authenticated:
            load=json.loads(request.body)
            item_id = load['item_id']
            quantity = load['quantity']
    
            item = Items.objects.filter(id=item_id).first()
            print(item)
            if item and item.product_quantity >= quantity:
                total_price = item.price * quantity
    
                order = Order(
                    user=request.user,
                    item=item,
                    product_name=item.product_name,
                    ordered_quantity=quantity,
                    ordered_price=total_price,
                
                )
                order.save()
    
            
                item.product_quantity -= quantity
                item.save()
    
                return JsonResponse({"message": "Order placed successfully", "total_price": total_price}, status=201)
    
            elif not item:
                return JsonResponse({"error": "Item not found."}, status=404)
            
            else:
                return JsonResponse({"error": "Insufficient quantity available."}, status=400)
        else:
            return JsonResponse({'message': 'User not logged in'}, status=401)
    else:
        return JsonResponse({"error": "Invalid request method"}, status=405)




def buy_cart(request):
    if request.method == 'POST':
        if request.user.is_authenticated:
            user = request.user
            cart_items = Cart.objects.filter(user=user, deleted_status=False)
            
            if not cart_items.exists():
                return JsonResponse({'error': 'No items in the cart to order.'}, status=400)

            for cart_item in cart_items:
                item = cart_item.item
                quantity_to_order = cart_item.quantity

                if item.product_quantity < quantity_to_order:
                    return JsonResponse({'error': f'Item with ID {item.pk} has insufficient quantity.'}, status=400)

                order_price = item.price * quantity_to_order

                Order.objects.create(
                    user=user,
                    item=item,
                    product_name=item.product_name,
                    ordered_quantity=quantity_to_order,
                    ordered_price=order_price,
                    
                )

                item.product_quantity -= quantity_to_order
                item.save()

            # Mark cart items as deleted
            cart_items.update(deleted_status=True)

            return JsonResponse({'message': 'Order placed successfully.'})
        else:
            return JsonResponse({'message': 'User not logged in.'}, status=401)
   
 
    
    elif request.method == 'PUT':
        if not request.user.is_authenticated:
            return JsonResponse({'message': 'User not logged in'}, status=401)

        load = json.loads(request.body)
        item_id = load.get('item_id')
        quantity= load.get('quantity')

        if item_id is None:
            return JsonResponse({'message': 'Item id does required'})

        # item = Items.objects.filter(pk=item_id,deleted_status=False).first()

        # if item is None:
        #     return JsonResponse({'message': 'Item matching query does not exist'}, status=404)

        # category = item.product_category

        cart_item= Cart.objects.get(item_id=item_id,deleted_status=False)

        if cart_item:
            cart_item.quantity = quantity
            cart_item.save()
            return JsonResponse({'message': 'Quantity Increased'})
        else:
            return JsonResponse({'message': 'No item for This Id'})
            
        
    else:
        return JsonResponse({'messege':'Invalid Request Method'},status=405)







# -----------------------------------------------------Search-----------------------------------------------



from django.db.models import Q


def search(request):
    if request.method == 'GET':
        search_query = request.GET.get('q', '')

        products = Items.objects.filter(
            Q(product_name__icontains=search_query) |
            Q(description__icontains=search_query) |
            Q(product_category__category_name__icontains=search_query),
            deleted_status=False 
        ).values('product_name', 'description')


        product_data = list(products)

        

        if product_data:
            return JsonResponse(product_data, safe=False)
        else:
            return JsonResponse({'message':"No products found matching the query."})


    else:
        return JsonResponse({'error': 'Invalid request method.'}, status=405)





# -----------------------------------------------------Old Api's-----------------------------------------------


def add(request):
    
    id = request.GET.get('id') 
    item_id=request.POST.get('item_id')
    product = get_object_or_404(Items,id=id)
    user =request.user
    if request.method=='POST':
        
        quantity= int(request.POST.get('quantity'))
        user_product,created= Order.objects.get_or_create(user=user,pruduct_name=product.product_name,item_id=item_id,added_to_cart=True)

        if created:
            user_product.ordered_quantity= quantity
        else:
            user_product.ordered_quantity+= quantity

        user_product.save()
        return JsonResponse({'message':'Product added to cart successfully.'})
    elif request.method == 'GET':
        
        # cart_item=Items.objects.get(deleted_status=False)
        cart_items=list(Order.objects.filter(user=user,added_to_cart=True).values())
        return JsonResponse(cart_items,safe=False)
    return JsonResponse({'message': 'Invalid request method'}, status=405)  



