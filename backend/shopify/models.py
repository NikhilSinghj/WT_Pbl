from django.db import models

from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    pass
    


class Category(models.Model):
    user=models.ForeignKey(User,on_delete=models.DO_NOTHING,null=True)    
    category_id=models.IntegerField(unique=True,null=True)
    category_name=models.CharField(max_length=20)
    category_image=models.ImageField(upload_to='')
    category_added_date=models.DateTimeField(auto_now_add=True)
    category_deleted_date=models.DateTimeField(null=True,blank=True)
    category_edited_date=models.DateTimeField(null=True,blank=True)
    deleted_status=models.CharField(max_length=20,default=False)



ITEM_CHOICES=(
    ("PER GK","/kg"),
    ("PER LETRE","/ltr"),
    ("PER QTY","/qty")
)

class Items(models.Model):
    
    product_category=models.ForeignKey(Category,on_delete=models.DO_NOTHING)
    product_name=models.CharField(max_length=30)
    price=models.FloatField()
    unit=models.CharField(max_length=10,choices=ITEM_CHOICES,default="PER QTY")
    image=models.ImageField(upload_to='')
    product_quantity=models.IntegerField()
    product_added_date=models.DateTimeField(auto_now_add=True)
    product_manufacture_date=models.DateField(null=True,blank=True)
    product_expiry_date=models.DateField(null=True,blank=True)
    description=models.TextField(max_length=200)
    deleted_status=models.BooleanField(default=False)



class Cart(models.Model):
    user=models.ForeignKey(User,on_delete=models.DO_NOTHING,null=True)
    item=models.ForeignKey(Items,on_delete=models.DO_NOTHING,null=True)
    deleted_status=models.BooleanField(default=False)
    quantity=models.IntegerField(default=0)



class Order(models.Model):
    user=models.ForeignKey(User,on_delete=models.DO_NOTHING)
    item=models.ForeignKey(Items,on_delete=models.DO_NOTHING)
    product_name=models.CharField(max_length=30)
    ordered_quantity=models.IntegerField(default=0)
    ordered_price=models.FloatField()
    ordered_date=models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'Order_item'        
    







