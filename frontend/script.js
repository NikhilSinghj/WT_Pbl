var myApp = angular.module("myApp", ["ui.router", "ngCookies"]);
// var apiUrl = "https://192.168.29.151 172.17.0.1:8000/shopify/";
var apiUrl = "https://127.0.0.1:8000/shopify/";


myApp.config(function ($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise("/Home");

  $stateProvider
    .state("Home", {
      url: "/Home",
      templateUrl: "index.html",
      controller: "indexController",
    })
    .state("Products", {
      url: "/Products",
      templateUrl: "template/products.html",
      controller: "productController",
    })
    .state("category", {
      url: "/Category",
      templateUrl: "template/category.html",
      controller: "categoryController",
    })
    .state("manager", {
      url: "/manager",
      templateUrl: "template/manager.html",
      controller: "managerController",
    })
    .state("Cart", {
      url: "/cart",
      templateUrl: "template/cart.html",
      controller: "cartController",
    })
    .state("addProduct", {
      url: "/addProduct",
      templateUrl: "template/addProduct.html",
      controller: "addProductController",
    });
});

myApp.factory("alertService", [
  "$rootScope",
  "$timeout",
  function ($rootScope, $timeout) {
    var alertService = {
      add: function (type, msg, section) {
        if (section === undefined) section = 1;
        $rootScope.alerts.push({
          type: type,
          msg: msg,
          section: section,
          close: function () {
            return alertService.closeAlert(this);
          },
        });

        $timeout(function () {
          alertService.closeAlert(this);
        }, 3000);
      },
      closeAlert: function (alert) {
        this.closeAlertIdx($rootScope.alerts.indexOf(alert));
      },
      closeAlertIdx: function (index) {
        return $rootScope.alerts.splice(index, 1);
      },
      clear: function () {
        $rootScope.alerts = [];
      },
    };

    $rootScope.$on("$stateChangeSuccess", function () {
      alertService.clear();
    });

    $rootScope.alerts = [];

    return alertService;
  },
]);

myApp.controller("indexController", [
  "$scope",
  "$http",
  "$state",
  "$window",
  "$filter",
  "$rootScope",
  function ($scope, $http, $state, $window, $filter, $rootScope) {
    console.log($rootScope.userLoggedIn);

    if ($rootScope.userLoggedIn === undefined) {
      $rootScope.userLoggedIn = false;
    }

    console.log($rootScope.userLoggedIn);

    $http({
      method: "GET",
      url: apiUrl + "",
      withCredentials: true,
    })
      .then(function(response){
        console.log(response.data);
        $scope.userStatus = response.data.message;
      })
      .catch(function(error){
        console.log(error);
      })

    $http({
      method: "GET",
      url: apiUrl + "getcategory/",
      withCredentials: true,
    })
      .then(function (response) {
        console.log(response);
        var categories = response.data;

        if (categories) {
          $scope.categories = categories;
        }

        console.log($scope.categories);
      })
      .catch(function (error) {
        if (error.data && error.data.message) {
          // $window.alert(error.data.message);
        } else {
          // $window.alert("An error occured. Please try again");
        }
      });

    $http({
      method: "GET",
      url: apiUrl + "getallitem/",
      withCredentials: true,
    })
      .then(function (response) {
        console.log(response);
        var products = response.data;

        if (products) {
          $scope.products = products;
        }

        console.log($scope.products);
      })
      .catch(function (error) {
        console.log(error);
      });

    $scope.searchTerm = "";
    $scope.filteredProducts = [];

    $scope.searchProducts = function () {
      if ($scope.searchTerm) {
        $scope.filteredProducts = $filter("filter")(
          $scope.products,
          $scope.searchTerm
        );
        $scope.length = $scope.filteredProducts.length;
      }
      if ($scope.length === 0) {
        Swal.fire({
          title: "Product/Category Not Found",
          text: "No products or categories matching your search term were found.",
          icon: "error",
          position: "top",
        }).then(function () {
          $scope.$apply(function () {
            $scope.searchTerm = "";
          });
        });
        console.log($scope.filteredProducts);
        console.log($scope.length);
      }
    };

    $scope.clearSearch = function () {
      $scope.searchTerm = "";
      $scope.filteredProducts = [];
      $scope.length = $scope.filteredProducts.length;
      console.log($scope.length);
    };

    $scope.selectedProduct = {};
    $scope.selectedProductQuantity = 1;

    $scope.updateTotalPrice = function (selectedProductQuantity) {
      $scope.totalPrice =
        $scope.selectedProduct.price * selectedProductQuantity;
    };

    $scope.openProductModal = function (index, selectedProduct) {
      console.log(selectedProduct);
      console.log(index);
      $("#productModal" + index).modal("show");
      $scope.totalPrice = selectedProduct.price;
      $scope.selectedProduct = selectedProduct;
      console.log($scope.totalPrice);
    };

    $scope.buyProduct = function (
      selectedProduct,
      selectedProductQuantity,
      index
    ) {
      $http({
        method: "POST",
        url: apiUrl + "orderproduct/",
        withCredentials: true,
        data: {
          item_id: selectedProduct.id,
          quantity: selectedProductQuantity,
        },
      })
        .then(function (response) {
          $scope.closeProductModal(index);
          Swal.fire({
            icon: "success",
            title: "Order Placed Successfully",
            text: "Your order has been successfully placed.",
            showConfirmButton: false,
            timer: 2000,
          });
          console.log(response);
        })
        .catch(function (error) {
          console.log(error);
        });
    };

    $scope.closeProductModal = function (index) {
      $("#productModal" + index).modal("hide");
    };

    $scope.addCart = function (product) {
      $http({
        method: "POST",
        url: apiUrl + "addtocart/",
        withCredentials: true,
        data: { item_id: product.id },
      })
        .then(function (response) {
          $window.alert(response.data.message);
        })
        .catch(function (error) {
          console.log(error);
          $window.alert(error.data.message);
        });
    };

    $scope.showLoginPopup = function () {
      Swal.fire({
        title: `<p class="text-center h1 fw-bold mb-3 mx-1 mx-md-4 mt-4">
      Login or Register
    </p>`,
        html: `
      <div class="form-floating mb-3">
        <input
          type="text"
          class="form-control"
          id="username"
          placeholder="Username"
        />
        <label >Username</label>
      </div>
      <div class="form-floating mb-3">
        <input
          type="password"
          class="form-control"
          placeholder="Password"
          id="password"
        />
        <label>Password</label>
      </div>
          `,
        showCancelButton: true,
        confirmButtonText: "Login",
        cancelButtonText: "Register",
        showLoaderOnConfirm: true,
        preConfirm: function () {
          var username = Swal.getPopup().querySelector("#username").value;
          var password = Swal.getPopup().querySelector("#password").value;

          if (!username || !password) {
            Swal.showValidationMessage(
              "Please enter both username and password"
            );
            return false;
          }

          var loginData = {
            username: username,
            password: password,
          };

          $http({
            method: "POST",
            url: apiUrl + "login/",
            data: loginData,
            withCredentials: true,
          })
            .then(function (response) {
              $rootScope.userLoggedIn = true;

              var verify = response.data.is_superuser;

              superuser = verify;

              console.log(response);
              if (superuser) {
                $state.go("manager");
              } else {
                Swal.fire({
                  icon: "success",
                  title: "You are logged in",
                  showConfirmButton: false,
                  timer: 2000,
                })
                $state.go("Home");
              }
            })
            .catch(function (error) {
              console.log("error", error);
            });
        },
        allowOutsideClick: function () {
          return !Swal.isLoading();
        },
      }).then(function (result) {
        if (result.dismiss === Swal.DismissReason.cancel) {
          $scope.showRegisterPopup();
        }
      });
    };

    $scope.logout = function () {
      $rootScope.userLoggedIn = false;

      $http({
        method: "GET",
        url: apiUrl + "logout/",
        withCredentials: true,
      })
        .then(function (response) {
          Swal.fire({
            icon: "success",
            title: "You are logged out",
            showConfirmButton: false,
            timer: 2000,
          })
          console.log(response);
        })
        .catch(function (error) {
          console.log(error);
        });
      $state.go("Home");
    };

    $scope.showRegisterPopup = function () {
      Swal.fire({
        title: "Register",
        html: `
        <div class="form-floating mb-3">
            <input type="text" id="username" class="form-control" placeholder="Username">
            <label >Username</label>
        </div>
        <div class="form-floating mb-3">
            <input type="email" id="email" class="form-control" placeholder="email@example.com">
            <label >Email</label>
        </div>
        <div class="form-floating mb-3">
            <input type="tel" id="contact" class="form-control" placeholder="Phone no">
            <label >Phone no</label>
        </div>
        <div class="form-floating mb-3">
            <input type="text" id="address" class="form-control" placeholder="Address">
            <label >Address</label>
        </div>
        <div class="form-floating mb-3">
            <input type="password" id="password" class="form-control" placeholder="Password">
            <label >Password</label>
        </div>
        <div class="form-floating mb-3">
            <input type="password" id="confirmPassword" class="form-control" placeholder="Confirm Password">
            <label >Confirm Password</label>
        </div>
          `,
        showCancelButton: true,
        confirmButtonText: "Register",
        cancelButtonText: "Cancel",
        showLoaderOnConfirm: true,
        preConfirm: function () {
          var username = Swal.getPopup().querySelector("#username").value;
          var email = Swal.getPopup().querySelector("#email").value;
          var contact = Swal.getPopup().querySelector("#contact").value;
          var address = Swal.getPopup().querySelector("#address").value;
          var password = Swal.getPopup().querySelector("#password").value;
          var confirmPassword =
            Swal.getPopup().querySelector("#confirmPassword").value;

          if (
            !username ||
            !email ||
            !password ||
            !confirmPassword ||
            !contact ||
            !address
          ) {
            Swal.showValidationMessage("Please fill all the fields");
            return;
          }

          if (!validateEmail(email)) {
            Swal.showValidationMessage("Invalid email address");
            return;
          }

          if (!validateContact(contact)) {
            Swal.showValidationMessage("Invalid Contact");
            return;
          }

          if (!validatePass(password)){
            Swal.showValidationMessage("Invali password pattern");
          }

          if (password !== confirmPassword) {
            Swal.showValidationMessage("Password does not match");
            return;
          }

          var registerData = {
            username: username,
            email: email,
            contact: contact,
            address: address,
            password: password,
          };

          $http({
            method: "POST",
            url: apiUrl + "register/",
            data: registerData,
          })
            .then(function (response) {
              $rootScope.userLoggedIn = true;
              console.log(response);
            })
            .catch(function (error) {
              console.log("error", error);
            });
        },
        allowOutsideClick: function () {
          return !Swal.isLoading();
        },
      }).then(function (result) {
        if (result.dismiss === Swal.DismissReason.cancel) {
        }
      });
    };

    function validateEmail(email) {
      var emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
      return emailPattern.test(email);
    }

    function validateContact(contact) {
      var contactPattern = /\s*[1-9]{1}[0-9]{9}\s*/;
      return contactPattern.test(contact);
    }

    function validatePass(password) {
      var passPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
      return passPattern.test(password);
    }

    // $(document).on("click", "#loginBtn", function (event) {
    //   event.preventDefault();

    //   console.log($rootScope.userLoggedIn);
    //   console.log(!$rootScope.userLoggedIn);

    //   if ($scope.userLoggedIn) {
    //     $scope.showLoginPopup();
    //   }
    // });
  },
]);

myApp.controller("managerController", [
  "$scope",
  "$http",
  "$state",
  "alertService",
  "$rootScope",
  function ($scope, $http, $state, alertService, $rootScope) {
    alertService.add("success", "Welcome to your dashboard", 1);

    $scope.categories = [];

    function display() {
      $http({
        method: "GET",
        url: apiUrl + "addcategory/",
        withCredentials: true,
      })
        .then(function (response) {
          console.log(response);
          var categories = response.data;

          if (categories) {
            $scope.categories = categories;
          }

          console.log($scope.categories);
        })
        .catch(function (error) {
          if (error.data && error.data.message) {
            // $window.alert(error.data.message);
          } else {
            // $window.alert("An error occured. Please try again");
          }
        });
    }

    display();

    
    $scope.displayProducts = function (category) {
      $http({
        method: "GET",
        url: apiUrl + "additem/",
        withCredentials: true,
        params: { id: category.id },
      })
        .then(function (response) {
          console.log(response);
          var products = response.data;

          if (products) {
            category.products = products;
          }

          // display();
          console.log(category.products);
        })
        .catch(function (error) {
          console.log(error);
        });
    };

    $scope.showCreateSection = function (event) {
      event.preventDefault();

      Swal.fire({
        title: "Create Section",
        html: `<div class="input-group">
      <div class="custom-file">
        <input type="text" class="section-name" id="sectionName">
        <input type="file" class="custom-file-input" id="sectionImage" accept="image/*">
      </div>
    </div>`,
        confirmButtonText: "Create",
        showCancelButton: true,
        cancelButtonText: "Cancel",
      }).then(function (result) {
        if (result.isConfirmed) {
          var sectionName = document.getElementById("sectionName").value;
          var sectionImage = document.getElementById("sectionImage").files[0];

          var formData = new FormData();
          formData.append("category_name", sectionName);
          formData.append("category_image", sectionImage);

          console.log(formData);

          $http({
            method: "POST",
            url: apiUrl + "addcategory/",
            withCredentials: true,
            data: formData,
            headers: { "Content-Type": undefined },
          })
            .then(function (response) {
              console.log(response);
              display();
            })
            .catch(function (error) {
              console.error(error);
            });
        }
      });
    };

    $scope.showModal = function (accordionIndex) {
      $("#addProductModal" + accordionIndex).modal("show");
    };

    $scope.hideModal = function (accordionIndex) {
      $("#addProductModal" + accordionIndex).modal("hide");
    };

    $scope.isAddProductModalOpen = [];

    $scope.$watchCollection(
      "isAddProductModalOpen",
      function (newValues, oldValues) {
        for (var i = 0; i < newValues.length; i++) {
          if (newValues[i] !== oldValues[i]) {
            if (newValues[i]) {
              $("#addProductModal" + i).modal("show");
              console.log("modal " + i + " triggered");
            } else {
              $("#addProductModal" + i).modal("hide");
              console.log("modal " + i + " hidden");
            }
          }
        }
      }
    );

    $scope.product = {};

    $scope.addProduct = function (category, index) {
      console.log("Index:", index);
      var productImage = document.getElementById("productImage" + index)
        .files[0];
      console.log("productImage:", productImage);

      var manufacturingDate = new Date($scope.product.manufacturingDate);

      var formattedManufacturingDate =
        manufacturingDate.getFullYear() +
        "-" +
        (manufacturingDate.getMonth() + 1) +
        "-" +
        manufacturingDate.getDate();

      var expiryDate = new Date($scope.product.expiryDate);

      var formattedExpiryDate =
        expiryDate.getFullYear() +
        "-" +
        (expiryDate.getMonth() + 1) +
        "-" +
        expiryDate.getDate();

      var productData = new FormData();

      productData.append("product_category", category.id);
      productData.append("product_name", $scope.product.name);
      productData.append("description", $scope.product.description);
      productData.append("price", $scope.product.price);
      productData.append("product_quantity", $scope.product.quantity);
      productData.append("unit", $scope.product.unit);
      productData.append(
        "product_manufacture_date",
        formattedManufacturingDate
      );
      productData.append("product_expiry_date", formattedExpiryDate);
      productData.append("image", productImage);

      console.log(productData);

      $http({
        method: "POST",
        url: apiUrl + "additem/",
        withCredentials: true,
        data: productData,
        headers: { "Content-Type": undefined },
      })
        .then(function (response) {
          console.log(response);
        })
        .catch(function (error) {
          console.error(error);
        });

      $scope.product = {};

      $scope.hideModal();
    };

    $scope.editProduct = function (product, accordionIndex, index) {
      $("#editProductModal" + accordionIndex + index).modal("show");

      console.log("#editProductModal" + accordionIndex + index);

      if ($scope.editingProduct) {
        $scope.cancelProductEdit($scope.editingProduct);
      }

      product.editMode = true;
      $scope.editingProduct = product;
      $scope.editingProduct.updateName = product.product_name;
      $scope.editingProduct.updateImage = product.image;
      $scope.editingProduct.updateDescription = product.description;
      $scope.editingProduct.updatePrice = product.price;
      $scope.editingProduct.updateQuantity = product.product_quantity;
      $scope.editingProduct.updateUnit = product.unit;
      $scope.editingProduct.updateMfgDate = new Date(
        product.product_manufacture_date
      );
      $scope.editingProduct.updateExpDate = new Date(
        product.product_expiry_date
      );

      console.log("Edit button clicked for product:", product);
    };

    $scope.cancelProductEdit = function (
      editingProduct,
      accordionIndex,
      index
    ) {
      console.log(editingProduct);

      $("#editProductModal" + accordionIndex + index).modal("hide");

      editingProduct.editMode = false;
      editingProduct.updateName = editingProduct.product_name;
      editingProduct.updateImage = editingProduct.image;
      editingProduct.updateDescription = editingProduct.description;
      editingProduct.updatePrice = editingProduct.price;
      editingProduct.updateQuantity = editingProduct.product_quantity;
      editingProduct.updateUnit = editingProduct.unit;
      editingProduct.updateMfgDate = new Date(
        editingProduct.product_manufacture_date
      );
      editingProduct.updateExpDate = new Date(
        editingProduct.product_expiry_date
      );

      console.log("Edit cancelled for product:", editingProduct);
    };

    $scope.saveProductEdit = function (product, accordionIndex, index) {
      console.log(product);

      if (product.updateName) {
        product.product_name = product.updateName;
        product.image = product.updateImage;
        product.description = product.updateDescription;
        product.price = product.updatePrice;
        product.product_quantity = product.updateQuantity;
        product.unit = product.updateUnit;
        product.product_manufacture_date = product.updateMfgDate;
        product.product_expiry_date = product.updateExpDate;
      }

      var testImage = document.getElementById("editingProductImage").files[0];

      var formattedMfgDate =
        product.updateMfgDate.getFullYear() +
        "-" +
        (product.updateMfgDate.getMonth() + 1) +
        "-" +
        product.updateMfgDate.getDate();

      var formattedExpDate =
        product.updateExpDate.getFullYear() +
        "-" +
        (product.updateExpDate.getMonth() + 1) +
        "-" +
        product.updateExpDate.getDate();

      var updatedProductData = new FormData();
      updatedProductData.append("product_name", product.updateName);
      updatedProductData.append("image", testImage);
      updatedProductData.append("description", product.updateDescription);
      updatedProductData.append("price", product.updatePrice);
      updatedProductData.append("product_quantity", product.updateQuantity);
      updatedProductData.append("unit", product.updateUnit);
      updatedProductData.append("product_manufacture_date", formattedMfgDate);
      updatedProductData.append("product_expiry_date", formattedExpDate);
      updatedProductData.append("item_id", product.id);
      updatedProductData.append(
        "product_category",
        product.product_category_id
      );

      console.log(updatedProductData);

      $http({
        method: "POST",
        url: apiUrl + "edititem/",
        withCredentials: true,
        data: updatedProductData,
        headers: { "Content-Type": undefined },
      })
        .then(function (response) {
          $("#editProductModal" + accordionIndex + index).modal("hide");
          product.editMode = false;

          // console.log("#editProductModal" + accordionIndex + index);

          console.log(response);
        })
        .catch(function (error) {
          console.log(error);
        });

      console.log("save product completed");
    };

    $scope.delProduct = function (product) {
      $http({
        method: "DELETE",
        url: apiUrl + "additem/",
        withCredentials: true,
        data: { id: product.id },
      })
        .then(function (response) {
          console.log("Product deleted");
          // alertService.add("success", "Category deleted succesfully", 2);
        })
        .catch(function (error) {
          console.log(error);
        });
    };

    $scope.edit = function (category) {
      if ($scope.editingProduct) {
        $scope.cancelEdit($scope.editingProduct);
      }

      category.editMode = true;
      $scope.editingProduct = category;
      category.updateName = category.category_name;
      category.updateImage = category.category_image;
    };

    $scope.cancelEdit = function (category) {
      category.editMode = false;
      category.updateName = category.category_name;
      category.updateImage = category.category_image;
    };

    $scope.saveEdit = function (category) {
      if (category.updateName) {
        category.category_name = category.updateName;
        category.category_image = category.updateImage;
      }

      var testImage = document.getElementById("updatedImage").files[0];

      var formData = new FormData();
      formData.append("category_name", category.updateName);
      formData.append("category_image", testImage);
      formData.append("id", category.id);

      console.log(formData);

      $http({
        method: "POST",
        url: apiUrl + "editcategory/",
        withCredentials: true,
        data: formData,
        headers: { "Content-Type": undefined },
      })
        .then(function (response) {
          display()
          console.log(response);
        })
        .catch(function (error) {
          console.log(error);
        });
    };

    $scope.delete = function (category) {
      $http({
        method: "DELETE",
        url: apiUrl + "addcategory/",
        withCredentials: true,
        data: { category_id: category.id },
      })
        .then(function (response) {
          console.log("deleted");
          display();
          alertService.add("success", "Category deleted succesfully", 2);
        })
        .catch(function (error) {
          console.log(error);
        });
    };

    $scope.logout = function () {
      $http({
        method: "GET",
        url: apiUrl + "logout/",
        withCredentials: true,
      })
        .then(function (response) {
          console.log("Logout response:", response);
          $rootScope.userLoggedIn = false;
          $state.go("Home");
        })
        .catch(function (error) {
          console.log("Logout error:", error);
        });
    };
  },
]);

myApp.controller("productController", [
  "$scope",
  "$http",
  "$state",
  "alertService",
  function ($scope, $http, $state, alertService) {
    $http({
      method: "GET",
      url: apiUrl + "getallitem/",
      withCredentials: true,
    })
      .then(function (response) {
        console.log(response);

        var allproducts = response.data;

        if (allproducts) {
          $scope.allproducts = allproducts;
        }

        console.log($scope.allproducts);
      })
      .catch(function (error) {
        console.log(error);
      });
  },
]);

myApp.controller("cartController", [
  "$scope",
  "$http",
  "$state",
  "alertService",
  "$rootScope",
  function ($scope, $http, $state, $rootScope, alertService) {
    console.log($rootScope.userLoggedIn);

    function display() {
      $http({
        method: "GET",
        url: apiUrl + "addtocart",
        withCredentials: true,
      })
        .then(function (response) {
          console.log(response);
          var cartItems = response.data;

          if (cartItems) {
            $scope.cartItems = cartItems;

            $scope.totalPrice = cartItems.reduce(function (total, item) {
              return total + item.item__price * item.quantity;
            }, 0);
          } else {
            $scope.emptyCart = "Add items to cart";
          }

          console.log($scope.cartItems);
        })
        .catch(function (error) {
          console.log(error);
        });
    }

    display();

    $scope.updateQuantity = function (cartItem) {
      console.log(cartItem);
      changeQuantity(cartItem);
      updateTotalPrice();
    };

    function changeQuantity(cartItem) {
      $http({
        method: "PUT",
        url: apiUrl + "ordercart/",
        withCredentials: true,
        data: {
          item_id: cartItem.item__pk,
          quantity: cartItem.quantity,
        },
      })
        .then(function (response) {
          console.log(response);
        })
        .catch(function (error) {
          console.log(error);
        });
    }

    function updateTotalPrice() {
      $scope.totalPrice = $scope.cartItems.reduce(function (total, item) {
        return total + item.item__price * item.quantity;
      }, 0);
      console.log($scope.totalPrice);
    }

    $scope.order = function () {
      $http({
        method: "POST",
        url: apiUrl + "ordercart/",
        withCredentials: true,
      })
        .then(function (response) {
          Swal.fire({
            icon: "success",
            title: "Order Placed Successfully",
            text: "Your order has been successfully placed.",
            showConfirmButton: false,
            timer: 2000,
          });
          display();
        })
        .catch(function (error) {
          console.log(error);
        });
    };

    $scope.removefromcart = function (cartItem) {
      $http({
        method: "DELETE",
        url: apiUrl + "addtocart",
        withCredentials: true,
        data: { item_id: cartItem.item__pk },
      })
        .then(function (response) {
          console.log(response);
          display();
        })
        .catch(function (error) {
          console.log(error);
        });
    };

    $scope.userLoggedIn = function () {
      $rootScope.userLoggedIn = true;
      console.log($rootScope.userLoggedIn);
    };
  },
]);
