package com.food4fit.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.food4fit.model.Food;

public interface FoodRepository extends JpaRepository<Food, Long> {
}
