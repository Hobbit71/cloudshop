"""Tests for order routes."""
import pytest
from uuid import uuid4
from fastapi.testclient import TestClient
from app.main import app
from app.models.order import OrderStatus


@pytest.fixture
def client(override_get_db):
    """Test client."""
    return TestClient(app)


@pytest.fixture
def auth_headers(customer_id):
    """Authentication headers."""
    return {"X-User-Id": str(customer_id)}


def test_health_check(client):
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_create_order(client, auth_headers, sample_order_data):
    """Test creating an order."""
    response = client.post(
        "/api/v1/orders",
        json=sample_order_data,
        headers=auth_headers
    )
    
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["status"] == "PENDING"
    assert len(data["items"]) == 1


def test_get_order(client, auth_headers, sample_order):
    """Test getting an order."""
    response = client.get(
        f"/api/v1/orders/{sample_order.id}",
        headers={"X-User-Id": str(sample_order.customer_id)}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(sample_order.id)


def test_get_order_not_found(client, auth_headers):
    """Test getting non-existent order."""
    non_existent_id = uuid4()
    response = client.get(
        f"/api/v1/orders/{non_existent_id}",
        headers=auth_headers
    )
    
    assert response.status_code == 404


def test_list_orders(client, auth_headers, sample_order):
    """Test listing orders."""
    response = client.get(
        "/api/v1/orders",
        headers={"X-User-Id": str(sample_order.customer_id)}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "orders" in data
    assert "total" in data
    assert data["total"] >= 1


def test_update_order_status(client, auth_headers, sample_order):
    """Test updating order status."""
    response = client.put(
        f"/api/v1/orders/{sample_order.id}/status",
        json={"status": "PROCESSING"},
        headers={"X-User-Id": str(sample_order.customer_id)}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "PROCESSING"


def test_cancel_order(client, auth_headers, sample_order):
    """Test cancelling order."""
    response = client.post(
        f"/api/v1/orders/{sample_order.id}/cancel",
        headers={"X-User-Id": str(sample_order.customer_id)}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "CANCELLED"


def test_get_order_tracking(client, auth_headers, sample_order):
    """Test getting order tracking."""
    response = client.get(
        f"/api/v1/orders/{sample_order.id}/tracking",
        headers={"X-User-Id": str(sample_order.customer_id)}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "tracking_number" in data
    assert "carrier" in data


def test_get_merchant_orders(client, sample_order):
    """Test getting merchant orders."""
    response = client.get(
        f"/api/v1/orders/merchant/{sample_order.merchant_id}"
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "orders" in data
    assert "total" in data

