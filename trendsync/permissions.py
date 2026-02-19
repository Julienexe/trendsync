from rest_framework import permissions

class IsBuyer(permissions.BasePermission):
    """
    Allows access only to users with a buyer profile.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and hasattr(request.user, 'buyer_profile')

class IsSeller(permissions.BasePermission):
    """
    Allows access only to users with a seller profile.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and hasattr(request.user, 'seller_profile')

class IsOwner(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an object to edit it.
    Assumes the model instance has a `seller` or `buyer` attribute.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any authenticated request,
        # always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Instance must have an attribute matching the user's profile.
        if hasattr(obj, 'seller') and obj.seller == request.user.seller_profile:
            return True
        if hasattr(obj, 'buyer') and obj.buyer == request.user.buyer_profile:
            return True
        if hasattr(obj, 'user') and obj.user == request.user:
            return True
        return False