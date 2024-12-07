from django.urls import path
from shopify import views

urlpatterns = [
    
     path('register/', views.register_user),
     path('login/', views.login_user),
     path('logout/', views.logout_user),
     path('addcategory/',views.add_category),
     path('editcategory/',views.edit_category),
     path('additem/',views.add_items),
     path('getitem/',views.get_item),
     path('getallitem/',views.get_all_item),
     path('getcategory/',views.get_category),
     path('addtocart/',views.add_to_cart),
     path('edititem/',views.edit_item),
     path('orderproduct/',views.buy_item),
     path('ordercart/',views.buy_cart),
     path('searchbypoi/',views.search),
     
  
]
