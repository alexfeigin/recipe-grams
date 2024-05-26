#!/bin/bash

# Function to round a number to the nearest integer
round() {
    printf "%.0f" "$1"
}

# Function to display help message
_show_help_calculate_dough_recipe() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -d, --desired-dough <weight>               Desired dough weight in grams (default: 1000)"
    echo "  -h, --hydration-percentage <percentage>    Hydration percentage (default: 0.75)"
    echo "  -p, --poolish-percentage <percentage>      Poolish percentage (default: 0.5)"
    echo "  -ph, --poolish-hydration <percentage>      Poolish hydration percentage (default: 1.0)"
    echo "  -py, --poolish-yeast <percentage>          Poolish yeast percentage (default: 0.001)"
    echo "  -ry, --rest-yeast <percentage>             Rest of dough yeast percentage (default: 0.001)"
    echo "  -s, --salt <percentage>                    Salt percentage (default: 0.02)"
    echo "  --help                                     Display this help message"
}

# Function to calculate dough recipe
calculate_dough_recipe() {
    # Default values
    desired_dough="1700"
    hydration_percentage="0.70"
    poolish_percentage="0.67"
    poolish_hydration_percentage="1.0"
    poolish_yeast_percentage="0.0013"
    rest_dough_yeast_percentage="0"
    salt_percentage="0.027"

    # Parse named arguments
    while [[ "$#" -gt 0 ]]; do
        case $1 in
            -d|--desired-dough) desired_dough="$2"; shift ;;
            -h|--hydration-percentage) hydration_percentage="$2"; shift ;;
            -p|--poolish-percentage) poolish_percentage="$2"; shift ;;
            -ph|--poolish-hydration) poolish_hydration_percentage="$2"; shift ;;
            -py|--poolish-yeast) poolish_yeast_percentage="$2"; shift ;;
            -ry|--rest-yeast) rest_dough_yeast_percentage="$2"; shift ;;
            -s|--salt) salt_percentage="$2"; shift ;;
            --help) _show_help_calculate_dough_recipe; exit 0 ;;
            *) echo "Unknown parameter passed: $1"; _show_help_calculate_dough_recipe; exit 1 ;;
        esac
        shift
    done

    # Calculate total flour and total water
    total_flour=$(echo "scale=2; $desired_dough / (1 + $hydration_percentage)" | bc)
    total_water=$(echo "scale=2; $desired_dough - $total_flour" | bc)

    # Calculate poolish ingredients
    poolish_flour=$(echo "scale=2; $total_flour * $poolish_percentage" | bc)
    poolish_water=$(echo "scale=2; $poolish_flour * $poolish_hydration_percentage" | bc)
    poolish_yeast=$(echo "scale=5; $poolish_flour * $poolish_yeast_percentage" | bc)

    # Calculate rest of ingredients
    rest_flour=$(echo "scale=2; $total_flour - $poolish_flour" | bc)
    rest_water=$(echo "scale=2; $total_water - $poolish_water" | bc)
    rest_yeast=$(echo "scale=5; $total_flour * $rest_dough_yeast_percentage" | bc)
    salt=$(echo "scale=2; $total_flour * $salt_percentage" | bc)

    # Round the results
    total_flour=$(round $total_flour)
    total_water=$(round $total_water)
    poolish_flour=$(round $poolish_flour)
    poolish_water=$(round $poolish_water)
    poolish_yeast=$(round $poolish_yeast)
    rest_flour=$(round $rest_flour)
    rest_water=$(round $rest_water)
    rest_yeast=$(round $rest_yeast)
    salt=$(round $salt)

    # Print the recipe
    echo ""
    echo "Dough Recipe:"
    echo "-------------"
    echo "Total flour: $total_flour grams"
    echo "Total water: $total_water grams"
    echo ""
    echo "Poolish:"
    echo "  Poolish flour: $poolish_flour grams"
    echo "  Poolish water: $poolish_water grams"
    echo "  Poolish yeast: $poolish_yeast grams"
    echo ""
    echo "Rest of dough:"
    echo "  Rest of flour: $rest_flour grams"
    echo "  Rest of water: $rest_water grams"
    [[ $rest_yeast -gt 0 ]] && echo "  Rest of yeast: $rest_yeast grams"
    echo "  Salt: $salt grams"
}

pizza() {
  [[ "X$1" == "X" ]] && factor=1 || factor=$1
  dough=$(echo "scale=5; 283.33333 * $factor" | bc)
  echo "Total dough weight: $(round "$dough") grams"
  calculate_dough_recipe -d "$dough" -h 0.7 -p 0.67 -ph 1.0 -py 0.013 -ry 0 -s 0.027
}