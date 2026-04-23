async def test_create_meal_plan(auth_client):
    response = await auth_client.post("/meal-plans", json={
        "week_start_date": "2026-04-21",
        "name": "Week 1",
    })
    assert response.status_code == 201
    assert response.json()["name"] == "Week 1"


async def test_list_meal_plans(auth_client):
    await auth_client.post("/meal-plans", json={"week_start_date": "2026-04-21", "name": "Week 1"})
    response = await auth_client.get("/meal-plans")
    assert response.status_code == 200
    assert len(response.json()) == 1


async def test_add_entry_to_plan(auth_client):
    plan = (await auth_client.post("/meal-plans", json={"week_start_date": "2026-04-21", "name": "W1"})).json()
    response = await auth_client.post(f"/meal-plans/{plan['id']}/entries", json={
        "day_of_week": 0,
        "meal_type": "breakfast",
        "custom_meal_name": "Eggs",
        "servings": 1,
    })
    assert response.status_code == 201
    assert response.json()["meal_type"] == "breakfast"


async def test_get_plan_with_entries(auth_client):
    plan = (await auth_client.post("/meal-plans", json={"week_start_date": "2026-04-21", "name": "W1"})).json()
    await auth_client.post(f"/meal-plans/{plan['id']}/entries", json={
        "day_of_week": 1, "meal_type": "lunch", "custom_meal_name": "Salad", "servings": 1,
    })
    response = await auth_client.get(f"/meal-plans/{plan['id']}")
    assert response.status_code == 200
    assert len(response.json()["entries"]) == 1


async def test_delete_entry(auth_client):
    plan = (await auth_client.post("/meal-plans", json={"week_start_date": "2026-04-21", "name": "W1"})).json()
    entry = (await auth_client.post(f"/meal-plans/{plan['id']}/entries", json={
        "day_of_week": 2, "meal_type": "dinner", "custom_meal_name": "Fish", "servings": 1,
    })).json()
    response = await auth_client.delete(f"/meal-plans/{plan['id']}/entries/{entry['id']}")
    assert response.status_code == 204
